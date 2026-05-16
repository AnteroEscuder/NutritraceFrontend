import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ForumIcon from "@mui/icons-material/Forum";
import GroupsIcon from "@mui/icons-material/Groups";
import SendIcon from "@mui/icons-material/Send";
import WifiIcon from "@mui/icons-material/Wifi";

import AppLayout from "../components/AppLayout";
import PageHero from "../components/PageHero";
import { useAuth } from "../context/AuthContext";
import { API_BASE, connectCommunitySocket, getCommunityMessages } from "../api";
import { useI18n } from "../i18n/I18nContext";

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

function timeAgo(dateValue, t) {
  if (!dateValue) return "";

  const diff = Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000);

  if (diff < 60) return t("hace unos segundos");

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${t("hace")} ${minutes} ${minutes === 1 ? t("minuto") : t("minutos")}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${t("hace")} ${hours} ${hours === 1 ? t("hora") : t("horas")}`;

  const days = Math.floor(hours / 24);
  return `${t("hace")} ${days} ${days === 1 ? t("día") : t("días")}`;
}

function isNearBottom(el) {
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
}

function avatarSrc(path) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export default function CommunityChatPage() {
  const { token, user } = useAuth();

  const { t } = useI18n();
  const theme = useTheme();

  const roomId = "general";
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [wsStatus, setWsStatus] = useState("connecting"); // connecting | open | closed
  const [messages, setMessages] = useState([]);

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
      setError(e?.message || t("Error cargando chat"));
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
      setError(e?.message || t("Error cargando más mensajes"));
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = useCallback((text) => {
    const ws = wsRef.current;
    const payload = text.trim();
    if (!ws || ws.readyState !== WebSocket.OPEN || !payload) return;

    ws.send(JSON.stringify({ event: "new_message", data: { text: payload } }));
  }, []);

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;

    setWsStatus("connecting");
    let intentionalClose = false;
    let ws = null;

    const connectTimer = window.setTimeout(() => {
      if (intentionalClose) return;

      ws = connectCommunitySocket({ token });
      wsRef.current = ws;

      ws.onopen = () => {
        if (intentionalClose) return;
        setWsStatus("open");
        ws.send(JSON.stringify({ event: "join_room", data: { room_id: roomId } }));
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);

          if (msg.event === "message_created" && msg.data) {
            const shouldScroll = isNearBottom(listRef.current);

            setMessages((prev) => mergeMessages(prev, [msg.data]));

            if (shouldScroll) {
              setTimeout(scrollToBottom, 30);
            }
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        if (!intentionalClose) setWsStatus("closed");
      };
      ws.onclose = () => {
        if (!intentionalClose) setWsStatus("closed");
      };
    }, 150);

    return () => {
      intentionalClose = true;
      window.clearTimeout(connectTimer);

      try {
        if (wsRef.current === ws) wsRef.current = null;
        ws?.close();
      } catch {
        // ignore
      }
    };
  }, [token]);

  return (
    <AppLayout>
      <Box sx={{ display: "grid", gap: 2.5 }}>
        <PageHero
          chipIcon={<ForumIcon />}
          chipLabel={t("Espacio comunitario")}
          title={`${t("Comunidad")} · #${roomId}`}
          subtitle={t("Chat en tiempo real para compartir progreso, recetas y tips.")}
          actions={
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ sm: "flex-end" }}>
              <Chip icon={<GroupsIcon />} label={`${messages.length} ${t("mensajes")}`} variant="outlined" />
              <Chip
                icon={<WifiIcon />}
                color={wsStatus === "open" ? "success" : wsStatus === "connecting" ? "warning" : "error"}
                label={
                  wsStatus === "open"
                    ? t("conectado")
                    : wsStatus === "connecting"
                      ? t("conectando…")
                      : t("desconectado")
                }
              />
            </Stack>
          }
        />

        {error && <Alert severity="error">{String(error)}</Alert>}

        <Card
          sx={{
            height: { xs: "calc(100dvh - 220px)", md: "70vh" },
            minHeight: 460,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
          }}
        >
          {loading && <LinearProgress />}

          <CardContent sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", p: 0 }}>
            <Box
              sx={{
                px: { xs: 2, md: 2.5 },
                py: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: alpha(theme.palette.text.primary, 0.025),
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main" }}>
                  <ForumIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>{t("Chat")}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    #{roomId}
                  </Typography>
                </Box>
              </Stack>
              <Chip
                size="small"
                color={wsStatus === "open" ? "success" : wsStatus === "connecting" ? "warning" : "error"}
                label={
                  wsStatus === "open"
                    ? t("conectado")
                    : wsStatus === "connecting"
                      ? t("conectando…")
                      : t("desconectado")
                }
              />
            </Box>

            <Divider />

            <MessageList
              messages={messages}
              myId={myId}
              user={user}
              listRef={listRef}
              bottomRef={bottomRef}
              oldestId={oldestId}
              historyLoading={historyLoading}
              onLoadMore={loadMore}
            />

            <Divider />

            <ChatComposer wsStatus={wsStatus} onSend={sendMessage} />
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}

const MessageList = memo(function MessageList({
  messages,
  myId,
  user,
  listRef,
  bottomRef,
  oldestId,
  historyLoading,
  onLoadMore,
}) {
  const { t } = useI18n();
  const theme = useTheme();

  return (
    <Box
      ref={listRef}
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        px: { xs: 2, md: 2.5 },
        py: 2.25,
        display: "grid",
        gap: 1.75,
        overscrollBehavior: "contain",
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.common.black, 0.12)
            : alpha(theme.palette.primary.light, 0.035),
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button size="small" variant="text" onClick={onLoadMore} disabled={historyLoading || !oldestId}>
          {historyLoading ? t("Cargando…") : t("Cargar mensajes anteriores")}
        </Button>
      </Box>

      {messages.map((m) => {
        const mine = myId != null && String(m.user_id) === String(myId);
        return (
          <Box key={m.id} sx={{ display: "flex", gap: 1, justifyContent: mine ? "flex-end" : "flex-start" }}>
            {!mine && (
              <Avatar
                src={avatarSrc(m.user_profile_image_url)}
                sx={{
                  width: 36,
                  height: 36,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                }}
              >
                {initials(m.user_name)}
              </Avatar>
            )}

            <Box
              sx={{
                maxWidth: { xs: "88%", md: "72%" },
                px: 2,
                py: 1.25,
                borderRadius: mine ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                bgcolor: mine ? "primary.main" : "background.paper",
                color: mine ? "primary.contrastText" : "text.primary",
                border: mine ? "none" : "1px solid",
                borderColor: "divider",
                boxShadow: mine
                  ? `0 10px 24px ${alpha(theme.palette.primary.main, 0.22)}`
                  : `0 6px 18px ${alpha(theme.palette.common.black, 0.06)}`,
                backdropFilter: "blur(8px)",
                transition: "all .2s ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  opacity: mine ? 0.75 : 0.65,
                  fontWeight: 700,
                  display: "block",
                  mb: 0.4,
                }}
              >
                {mine ? t("Tú") : m.user_name}
              </Typography>
              <Typography
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: 1.45,
                  fontSize: "0.97rem",
                }}
              >
                {m.text}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.75,
                  opacity: 0.6,
                  textAlign: "right",
                  fontSize: "0.72rem",
                }}
              >
                {timeAgo(m.created_at, t)}
              </Typography>
            </Box>

            {mine && (
              <Avatar
                src={avatarSrc(user?.profile_image_url)}
                sx={{
                  width: 36,
                  height: 36,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                }}
              >
                {initials(user?.name || t("Tú"))}
              </Avatar>
            )}
          </Box>
        );
      })}

      <div ref={bottomRef} />
    </Box>
  );
});

function ChatComposer({ wsStatus, onSend }) {
  const { t } = useI18n();
  const theme = useTheme();
  const [text, setText] = useState("");

  const send = () => {
    const payload = text.trim();
    if (!payload || wsStatus !== "open") return;
    onSend(payload);
    setText("");
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        display: "flex",
        gap: 1,
        alignItems: "flex-end",
        bgcolor: alpha(theme.palette.background.paper, 0.92),
      }}
    >
      <TextField
        fullWidth
        placeholder={t("Escribe un mensaje…")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        multiline
        maxRows={4}
        size="small"
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            bgcolor: alpha(theme.palette.text.primary, 0.035),
          },
        }}
      />
      <IconButton
        color="primary"
        onClick={send}
        disabled={!text.trim() || wsStatus !== "open"}
        title={wsStatus !== "open" ? t("Chat desconectado") : t("Enviar")}
        sx={{
          width: 44,
          height: 44,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          "&:hover": { bgcolor: "primary.dark" },
          "&.Mui-disabled": {
            bgcolor: alpha(theme.palette.text.primary, 0.08),
          },
        }}
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
}
