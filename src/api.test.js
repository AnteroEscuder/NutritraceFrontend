import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFood,
  getCommunityMessages,
  listFoods,
  loginUser,
  registerUser,
} from "./api";

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registerUser sends JSON payload", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ id: 1, email: "ana@example.com" }));

    await expect(
      registerUser({ name: "Ana", email: "ana@example.com", password: "secret123" }),
    ).resolves.toEqual({ id: 1, email: "ana@example.com" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/auth/register",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: "Ana",
          email: "ana@example.com",
          password: "secret123",
        }),
      }),
    );
  });

  it("loginUser sends OAuth form data and returns the access token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ access_token: "token-123", token_type: "bearer" }),
    );

    await expect(
      loginUser({ email: "ana@example.com", password: "secret123" }),
    ).resolves.toBe("token-123");

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(options.body).toBe("username=ana%40example.com&password=secret123");
  });

  it("listFoods includes token and optional search query", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse([{ id: 1, name: "Avena" }]));

    await expect(listFoods({ token: "abc", search: "ave" })).resolves.toEqual([
      { id: 1, name: "Avena" },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/foods/?search=ave",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
  });

  it("createFood throws API error details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ detail: "Ya tienes un alimento con ese nombre" }, { status: 400 }),
    );

    await expect(
      createFood({
        token: "abc",
        payload: { name: "Avena", calories: 1, protein: 1, carbs: 1, fat: 1 },
      }),
    ).rejects.toThrow("Ya tienes un alimento con ese nombre");
  });

  it("getCommunityMessages builds pagination query", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));

    await getCommunityMessages({
      token: "abc",
      roomId: "general",
      limit: 10,
      beforeId: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/community/messages?room_id=general&limit=10&before_id=25",
      expect.objectContaining({
        headers: { Authorization: "Bearer abc" },
      }),
    );
  });
});
