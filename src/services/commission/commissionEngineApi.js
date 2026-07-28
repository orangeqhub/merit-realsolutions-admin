import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';
const base=`${API_BASE_URL}/v1/admin/commissions`; const headers={Authorization:`Bearer ${getAuthToken()}`};
async function call(path, options={}){const response=await fetch(`${base}${path}`,{...options,headers:{...headers,...(options.body?{'Content-Type':'application/json'}:{})}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||'Unable to load commission ledger.');return data.data;}
export const getBookingCommissions=(bookingId)=>call(`/booking/${bookingId}`); export const calculateBookingCommissions=(bookingId)=>call(`/calculate/${bookingId}`,{method:'POST'});
