import { dataStore } from "../repositories/dataStore.js";
import { nextId } from "../utils/idGenerator.js";

const today = () => new Date().toISOString().split("T")[0];

function fallbackLogo(name) {
  const label = encodeURIComponent(name || "Company");
  return `https://ui-avatars.com/api/?name=${label}&background=0a1628&color=ffffff&size=128&bold=true`;
}

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) return [];
  return gallery.map((item) =>
    typeof item === "string" ? item : URL.createObjectURL(item)
  );
}

export const companyService = {
  getAll() {
    return dataStore.getList("companies");
  },

  getById(id) {
    return dataStore.getList("companies").find((c) => c.id === id) || null;
  },

  getStatistics(companyId) {
    const ventures = dataStore.getList("ventures").filter((v) => v.developerId === companyId);
    const ventureIds = new Set(ventures.map((v) => v.id));
    const layouts = dataStore.getList("layouts").filter((l) => ventureIds.has(l.ventureId));
    const plots = dataStore.getList("plots").filter((p) => ventureIds.has(p.ventureId));
    const bookings = dataStore
      .getList("bookings")
      .filter((b) => ventureIds.has(b.ventureId) && b.status !== "Cancelled");
    const revenue =
      bookings.reduce((sum, b) => sum + (Number(b.advancePaid) || 0), 0) / 1e7;
    return {
      ventures: ventures.length,
      layouts: layouts.length,
      plots: plots.length,
      bookings: bookings.length,
      revenue,
    };
  },

  createCompany(data) {
    const companies = dataStore.getList("companies");
    const id = nextId("CMP", companies, 1001);
    const record = {
      ...data,
      id,
      logo:
        typeof data.logo === "string"
          ? data.logo
          : data.logo
            ? URL.createObjectURL(data.logo)
            : fallbackLogo(data.name),
      gallery: normalizeGallery(data.gallery),
      createdDate: today(),
      activities: [
        {
          type: "created",
          title: "Company created",
          description: "Onboarded to Merit Real Solutions ERP",
          date: today(),
        },
      ],
    };
    dataStore.updateList("companies", (list) => [record, ...list]);
    return record;
  },

  updateCompany(id, data) {
    const existing = dataStore.getList("companies").find((c) => c.id === id);
    if (!existing) return null;
    const record = {
      ...existing,
      ...data,
      gallery: data.gallery ? normalizeGallery(data.gallery) : existing.gallery,
      activities: [
        {
          type: "update",
          title: "Company updated",
          description: "Profile information edited",
          date: today(),
        },
        ...(existing.activities || []),
      ],
    };
    dataStore.updateList("companies", (list) =>
      list.map((c) => (c.id === id ? record : c))
    );
    return record;
  },

  deleteCompany(id) {
    dataStore.updateList("companies", (list) => list.filter((c) => c.id !== id));
    return { id };
  },
};
