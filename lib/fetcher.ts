import { api } from "@/lib/api";

export async function fetcher(url: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await api.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}
