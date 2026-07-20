/**
 * Simulated REST API — routes map to dataStore operations.
 * Runs synchronously in local mode for immediate CRUD sync + LocalStorage persistence.
 */

import { dataStore } from "../repositories/dataStore.js";

function ok(data) {
  return { ok: true, data };
}

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function parsePath(path) {
  const clean = path.replace(/^\//, "").split("/").filter(Boolean);
  return clean;
}

function findById(list, id) {
  const item = list.find((x) => x.id === id);
  if (!item) fail("Not found", 404);
  return item;
}

function routeListResource(segments, method, body) {
  const [resource, id, sub, subId] = segments;

  switch (resource) {
    case "ventures": {
      if (method === "GET" && !id) return ok(dataStore.getList("ventures"));
      if (method === "GET" && id && !sub) return ok(findById(dataStore.getList("ventures"), id));
      if (method === "GET" && id && sub === "layouts") {
        return ok(dataStore.getList("layouts").filter((l) => l.ventureId === id));
      }
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `VNT-${2001 + dataStore.getList("ventures").length}` };
        dataStore.updateList("ventures", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("ventures", (list) =>
          list.map((v) => {
            if (v.id !== id) return v;
            updated = { ...v, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("ventures", (list) => list.filter((v) => v.id !== id));
        return ok({ id });
      }
      break;
    }

    case "layouts": {
      if (method === "GET" && !id) return ok(dataStore.getList("layouts"));
      if (method === "GET" && id && !sub) return ok(findById(dataStore.getList("layouts"), id));
      if (method === "GET" && id && sub === "plots") {
        return ok(dataStore.getList("plots").filter((p) => p.layoutId === id));
      }
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `LYT-${3013 + dataStore.getList("layouts").length}` };
        dataStore.updateList("layouts", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("layouts", (list) =>
          list.map((l) => {
            if (l.id !== id) return l;
            updated = { ...l, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("layouts", (list) => list.filter((l) => l.id !== id));
        return ok({ id });
      }
      break;
    }

    case "plots": {
      if (method === "GET" && !id) return ok(dataStore.getList("plots"));
      if (method === "GET" && id && !sub) return ok(findById(dataStore.getList("plots"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `PLT-${100001 + dataStore.getList("plots").length}` };
        dataStore.updateList("plots", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("plots", (list) =>
          list.map((p) => {
            if (p.id !== id) return p;
            updated = { ...p, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("plots", (list) => list.filter((p) => p.id !== id));
        return ok({ id });
      }
      break;
    }

    case "customers": {
      if (method === "GET" && !id) return ok(dataStore.getList("customers"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("customers"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `CUST-${6001 + dataStore.getList("customers").length}` };
        dataStore.updateList("customers", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("customers", (list) =>
          list.map((c) => {
            if (c.id !== id) return c;
            updated = { ...c, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("customers", (list) => list.filter((c) => c.id !== id));
        return ok({ id });
      }
      break;
    }

    case "partners": {
      if (method === "GET" && !id) return ok(dataStore.getList("channelPartners"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("channelPartners"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `CP-${10001 + dataStore.getList("channelPartners").length}` };
        dataStore.updateList("channelPartners", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("channelPartners", (list) =>
          list.map((p) => {
            if (p.id !== id) return p;
            updated = { ...p, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("channelPartners", (list) => list.filter((p) => p.id !== id));
        return ok({ id });
      }
      break;
    }

    case "properties": {
      if (method === "GET" && !id) return ok(dataStore.getList("properties"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("properties"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `PRP-${5001 + dataStore.getList("properties").length}` };
        dataStore.updateList("properties", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("properties", (list) =>
          list.map((p) => {
            if (p.id !== id) return p;
            updated = { ...p, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("properties", (list) => list.filter((p) => p.id !== id));
        return ok({ id });
      }
      break;
    }

    case "companies": {
      if (method === "GET" && !id) return ok(dataStore.getList("companies"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("companies"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `CMP-${1001 + dataStore.getList("companies").length}` };
        dataStore.updateList("companies", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("companies", (list) =>
          list.map((c) => {
            if (c.id !== id) return c;
            updated = { ...c, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("companies", (list) => list.filter((c) => c.id !== id));
        return ok({ id });
      }
      break;
    }

    case "bookings": {
      if (method === "GET" && !id) return ok(dataStore.getList("bookings"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("bookings"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `BKG-${7001 + dataStore.getList("bookings").length}` };
        dataStore.updateList("bookings", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("bookings", (list) =>
          list.map((b) => {
            if (b.id !== id) return b;
            updated = { ...b, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("bookings", (list) => list.filter((b) => b.id !== id));
        return ok({ id });
      }
      break;
    }

    case "payments": {
      if (method === "GET" && !id) return ok(dataStore.getList("payments"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("payments"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `PAY-${8001 + dataStore.getList("payments").length}` };
        dataStore.updateList("payments", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("payments", (list) =>
          list.map((p) => {
            if (p.id !== id) return p;
            updated = { ...p, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("payments", (list) => list.filter((p) => p.id !== id));
        return ok({ id });
      }
      break;
    }

    case "leads": {
      if (method === "GET" && !id) return ok(dataStore.getList("leads"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("leads"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `LED-${9001 + dataStore.getList("leads").length}` };
        dataStore.updateList("leads", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("leads", (list) =>
          list.map((l) => {
            if (l.id !== id) return l;
            updated = { ...l, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("leads", (list) => list.filter((l) => l.id !== id));
        return ok({ id });
      }
      break;
    }

    case "followups": {
      if (method === "GET" && !id) return ok(dataStore.getList("followups"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("followups"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `FU-${9101 + dataStore.getList("followups").length}` };
        dataStore.updateList("followups", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("followups", (list) =>
          list.map((f) => {
            if (f.id !== id) return f;
            updated = { ...f, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("followups", (list) => list.filter((f) => f.id !== id));
        return ok({ id });
      }
      break;
    }

    case "agreements": {
      if (method === "GET" && !id) return ok(dataStore.getList("agreements"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("agreements"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `AGR-${4001 + dataStore.getList("agreements").length}` };
        dataStore.updateList("agreements", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("agreements", (list) =>
          list.map((a) => {
            if (a.id !== id) return a;
            updated = { ...a, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("agreements", (list) => list.filter((a) => a.id !== id));
        return ok({ id });
      }
      break;
    }

    case "registrations": {
      if (method === "GET" && !id) return ok(dataStore.getList("registrations"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("registrations"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `REG-${4101 + dataStore.getList("registrations").length}` };
        dataStore.updateList("registrations", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("registrations", (list) =>
          list.map((r) => {
            if (r.id !== id) return r;
            updated = { ...r, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("registrations", (list) => list.filter((r) => r.id !== id));
        return ok({ id });
      }
      break;
    }

    case "receipts": {
      if (method === "GET" && !id) return ok(dataStore.getList("receipts"));
      if (method === "GET" && id) return ok(findById(dataStore.getList("receipts"), id));
      if (method === "POST" && !id) {
        const record = { ...body, id: body.id || `RCT-${8101 + dataStore.getList("receipts").length}` };
        dataStore.updateList("receipts", (list) => [record, ...list]);
        return ok(record);
      }
      if (method === "PUT" && id) {
        let updated;
        dataStore.updateList("receipts", (list) =>
          list.map((r) => {
            if (r.id !== id) return r;
            updated = { ...r, ...body };
            return updated;
          })
        );
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateList("receipts", (list) => list.filter((r) => r.id !== id));
        return ok({ id });
      }
      break;
    }

    case "reservations": {
      const store = dataStore.getObject("reservations") || { reservations: [] };
      if (method === "GET" && !id) return ok(store.reservations || []);
      if (method === "GET" && id) {
        const item = (store.reservations || []).find((r) => r.id === id);
        if (!item) fail("Not found", 404);
        return ok(item);
      }
      if (method === "POST" && !id) {
        const record = {
          ...body,
          id: body.id || `RSV-${10001 + (store.reservations || []).length}`,
        };
        dataStore.updateObject("reservations", (obj) => ({
          ...obj,
          reservations: [record, ...(obj.reservations || [])],
        }));
        return ok(record);
      }
      if (method === "PUT" && id && !sub) {
        let updated;
        dataStore.updateObject("reservations", (obj) => ({
          ...obj,
          reservations: (obj.reservations || []).map((r) => {
            if (r.id !== id) return r;
            updated = { ...r, ...body };
            return updated;
          }),
        }));
        return ok(updated);
      }
      if (method === "PUT" && id && sub) {
        let updated;
        dataStore.updateObject("reservations", (obj) => ({
          ...obj,
          reservations: (obj.reservations || []).map((r) => {
            if (r.id !== id) return r;
            updated = typeof body === "function" ? body(r) : { ...r, ...body, action: sub };
            return updated;
          }),
        }));
        return ok(updated);
      }
      if (method === "DELETE" && id) {
        dataStore.updateObject("reservations", (obj) => ({
          ...obj,
          reservations: (obj.reservations || []).filter((r) => r.id !== id),
        }));
        return ok({ id });
      }
      break;
    }

    case "partner-assignments": {
      if (method === "GET" && !id) return ok(dataStore.getObject("partnerAssignments"));
      if (method === "PUT" && id) {
        dataStore.updateObject("partnerAssignments", (obj) => ({
          ...obj,
          assignments: { ...(obj.assignments || {}), [id]: body },
        }));
        return ok(dataStore.getObject("partnerAssignments").assignments[id]);
      }
      break;
    }

    case "engagement": {
      if (method === "GET") return ok(dataStore.getObject("engagement"));
      if (method === "PUT") {
        dataStore.setObject("engagement", body);
        return ok(body);
      }
      break;
    }

    case "reservation-settings": {
      if (method === "GET") return ok(dataStore.getObject("reservationSettings"));
      if (method === "PUT") {
        dataStore.setObject("reservationSettings", body);
        return ok(body);
      }
      break;
    }

    case "reservation-rules": {
      if (method === "GET") return ok(dataStore.getObject("reservationRules"));
      if (method === "PUT") {
        dataStore.setObject("reservationRules", body);
        return ok(body);
      }
      break;
    }

    default:
      break;
  }

  fail(`Route not found: ${method} ${path}`, 404);
}

/**
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} path
 * @param {unknown} [body]
 */
export function mockRequest(method, path, body) {
  if (!dataStore.initialized) fail("Data store not initialized", 503);
  const segments = parsePath(path);
  const result = routeListResource(segments, method, body);
  return result.data;
}

export async function mockGet(path) {
  return mockRequest("GET", path);
}

export async function mockPost(path, body) {
  return mockRequest("POST", path, body);
}

export async function mockPut(path, body) {
  return mockRequest("PUT", path, body);
}

export async function mockDelete(path) {
  return mockRequest("DELETE", path);
}
