import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { connectCommunitySocket, getCommunityMessages } from "../api";

function initials(name = "U") {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

function sortMessages(items = []) {
  return [...items].sort((a, b) => {
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
    if (aTime !== bTime) return aTime - bTime;

    const aId = Number(a?.id ?? 0);
    const bId = Number(b?.id ?? 0);
    return aId - bId;
  });
}

function mergeMessages(current = [], incoming = []) {
  const byId = new Map();
  [...current, ...incoming].forEach((msg) => {
    if (msg?.id != null) byId.set(String(msg.id), msg);
  });
  return sortMessages(Array.from(byId.values()));
}

export default function CommunityChatPage() {
  const { token, user } = useAuth();

  const roomId = "general";
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [wsStatus, setWsStatus] = useState("connecting"); // connecting | open | closed
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const listRef = useRef(null);

  const myId = user?.id;
  const oldestId = useMemo(() => (messages.length ? messages[0]?.id ?? null : null), [messages]);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const loadInitial = async () => {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      const data = await getCommunityMessages({ token, roomId, limit: 50 });
      setMessages(sortMessages(Array.isArray(data) ? data : []));
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      setError(e?.message || "Error cargando chat");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!token || !oldestId || historyLoading) return;

    const listEl = listRef.current;
    const previousScrollHeight = listEl?.scrollHeight ?? 0;
    const previousScrollTop = listEl?.scrollTop ?? 0;

    setHistoryLoading(true);
    setError("");
    try {
      const more = await getCommunityMessages({ token, roomId, limit: 50, beforeId: oldestId });
      if (Array.isArray(more) && more.length) {
        setMessages((prev) => mergeMessages(prev, more));

        requestAnimationFrame(() => {
          const el = listRef.current;
          if (!el) return;
          const nextScrollHeight = el.scrollHeight;
          el.scrollTop = previousScrollTop + (nextScrollHeight - previousScrollHeight);
        });
      }
    } catch (e) {
      setError(e?.message || "Error cargando más mensajes");
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = () => {
    const ws = wsRef.current;
    const payload = text.trim();
    if (!ws || ws.readyState !== WebSocket.OPEN || !payload) return;

    ws.send(JSON.stringify({ event: "new_message", data: { text: payload } }));
    setText("");
  };

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;

    setWsStatus("connecting");
    const ws = connectCommunitySocket({ token });
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("open");
      ws.send(JSON.stringify({ event: "join_room", data: { room_id: roomId } }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.event === "message_created" && msg.data) {
          setMessages((prev) => mergeMessages(prev, [msg.data]));
          setTimeout(scrollToBottom, 30);
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => setWsStatus("closed");
    ws.onclose = () => setWsStatus("closed");

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }, [token]);

  return (
    <AppLayout>
      <Box sx={{ display: "grid", gap: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            Comunidad · #{roomId}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Chat en tiempo real para compartir progreso, recetas y tips.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Card sx={{ height: { xs: "calc(100dvh - 180px)", md: "70vh" }, minHeight: 420, display: "flex", flexDirection: "column" }}>
          {loading && <LinearProgress />}

          <CardContent sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", p: 0 }}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontWeight: 900 }}>Chat</Typography>
              <Chip
                size="small"
                label={wsStatus === "open" ? "🟢 conectado" : wsStatus === "connecting" ? "🟡 conectando…" : "🔴 desconectado"}
              />
            </Box>

            <Divider />

            <Box
              ref={listRef}
              sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, py: 2, display: "grid", gap: 1.25, overscrollBehavior: "contain" }}
            >
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button size="small" variant="text" onClick={loadMore} disabled={historyLoading || !oldestId}>
                  {historyLoading ? "Cargando…" : "Cargar mensajes anteriores"}
                </Button>
              </Box>

              {messages.map((m) => {
                const mine = myId != null && String(m.user_id) === String(myId);
                return (
                  <Box key={m.id} sx={{ display: "flex", gap: 1, justifyContent: mine ? "flex-end" : "flex-start" }}>
                    {!mine && <Avatar sx={{ width: 32, height: 32 }}>{initials(m.user_name)}</Avatar>}

                    <Box
                      sx={{
                        maxWidth: "75%",
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,
                        bgcolor: mine ? "action.selected" : "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                        {mine ? "Tú" : m.user_name}
                      </Typography>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{m.text}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                      </Typography>
                    </Box>

                    {mine && <Avatar sx={{ width: 32, height: 32 }}>{initials(user?.name || "Tú")}</Avatar>}
                  </Box>
                );
              })}

              <div ref={bottomRef} />
            </Box>

            <Divider />

            <Box sx={{ p: 2, display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                fullWidth
                placeholder="Escribe un mensaje…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                multiline
                maxRows={4}
              />
              <IconButton color="primary" onClick={sendMessage} disabled={!text.trim() || wsStatus !== "open"}>
                <SendIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
