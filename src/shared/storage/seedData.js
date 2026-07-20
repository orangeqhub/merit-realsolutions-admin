/**
 * Initial seed data — only loaded when LocalStorage is empty.
 * UI must never import this file.
 */

import venturesData from "../../data/ventures.json";
import layoutsData from "../../data/layouts.json";
import plotsData from "../../data/plots.json";
import customersData from "../../data/customers.json";
import channelPartnersData from "../../data/channelPartners.json";
import bookingsData from "../../data/bookings.json";
import paymentsData from "../../data/payments.json";
import leadsData from "../../data/leads.json";
import followupsData from "../../data/followups.json";
import agreementsData from "../../data/agreements.json";
import registrationsData from "../../data/registrations.json";
import receiptsData from "../../data/receipts.json";
import reservationsData from "../../data/reservations.json";
import partnerAssignmentsData from "../../data/partnerAssignments.json";
import engagementData from "../../data/engagement.json";
import reservationSettingsData from "../../data/reservationSettings.json";
import reservationRulesData from "../../data/reservationRules.json";

export function getSeedData() {
  return {
    ventures: venturesData,
    layouts: layoutsData,
    plots: plotsData,
    properties: [],
    customers: customersData,
    channelPartners: channelPartnersData,
    bookings: bookingsData,
    payments: paymentsData,
    companies: [],
    leads: leadsData,
    followups: followupsData,
    agreements: agreementsData,
    registrations: registrationsData,
    receipts: receiptsData,
    reservations: reservationsData,
    partnerAssignments: partnerAssignmentsData,
    engagement: engagementData,
    reservationSettings: reservationSettingsData,
    reservationRules: reservationRulesData,
  };
}
