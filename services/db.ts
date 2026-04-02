
import { FoodItem, UserData, ClaimHistoryItem, FAQItem, BroadcastMessage, Address, AdminUser, SystemLog } from '../types';

/**
 * URL Google Apps Script Web App.
 * PENTING: Ganti string ini dengan URL Web App Anda sendiri yang BARU setelah melakukan Deploy!
 */
const API_URL = "http://localhost:5000/api";

const sendRequest = async <T>(action: string, data: any = {}): Promise<T> => {
  console.log(`%c[API REQUEST] ${action}`, 'color: blue; font-weight: bold;', data);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, data }),
      headers: {
        'Content-Type': 'application/json', 
      },
    });

    const text = await response.text();
    let json;
    
    try {
        json = JSON.parse(text);
    } catch (e) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.error(`%c[API PARSE ERROR] ${action}`, 'color: red; font-weight: bold;', "Raw text:", text);
        if (text.trim().startsWith('<')) {
             throw new Error("Server Error: Check Deployment URL. Make sure it ends in /exec and permissions are set to 'Anyone'.");
        }
        throw new Error("Server Error: Received invalid response from backend.");
    }

    if (!response.ok) {
        throw new Error(json.message ? json.message : `HTTP error! status: ${response.status}`);
    }

    if (json.status === 'error') {
      console.error(`%c[API BACKEND ERROR] ${action}`, 'color: red; font-weight: bold;', json.message);
      throw new Error(json.message || "Unknown server error");
    }
    
    console.log(`%c[API SUCCESS] ${action}`, 'color: green; font-weight: bold;', json.data);
    return json.data;
  } catch (error: any) {
    console.error(`%c[API NETWORK/CLIENT ERROR] ${action}`, 'color: red; font-weight: bold;', error);
    throw error;
  }
};

export const db = {
  // --- USERS ---
  registerUser: (userData: any) => sendRequest<UserData>('REGISTER_USER', userData),
  loginUser: (credentials: any) => sendRequest<UserData>('LOGIN_USER', credentials), 
  getUsers: () => sendRequest<UserData[]>('GET_USERS'),
  upsertUser: (user: UserData) => sendRequest<UserData>('UPSERT_USER', user),

  // --- ADDRESSES ---
  getAddresses: (userId?: string) => sendRequest<Address[]>('GET_ADDRESSES', { userId }),
  addAddress: (address: Address) => sendRequest<Address>('ADD_ADDRESS', address),
  updateAddress: (address: Address) => sendRequest<Address>('UPDATE_ADDRESS', address),
  deleteAddress: (id: string) => sendRequest<any>('DELETE_ADDRESS', { id }),

  // --- INVENTORY ---
  getInventory: (providerId?: string) => sendRequest<FoodItem[]>('GET_INVENTORY', { providerId }),
  addFoodItem: (item: FoodItem) => sendRequest<FoodItem>('ADD_FOOD_ITEM', item),
  updateFoodStock: (id: string, newQuantity: number) => sendRequest<any>('UPDATE_FOOD_STOCK', { id, newQuantity }),
  updateFoodItem: (item: FoodItem) => sendRequest<FoodItem>('UPDATE_FOOD_ITEM', item), 
  deleteFoodItem: (id: string) => sendRequest<any>('DELETE_FOOD_ITEM', { id }), 
  
  uploadImage: (base64: string, filename?: string, folderType: string = 'inventory') => 
    sendRequest<string>('UPLOAD_IMAGE', { base64, filename, folderType }),

  // --- CLAIMS ---
  getClaims: (filters: { providerId?: string, receiverId?: string } = {}) => sendRequest<ClaimHistoryItem[]>('GET_CLAIMS', filters),
  addClaim: (claim: ClaimHistoryItem) => sendRequest<ClaimHistoryItem>('ADD_CLAIM', claim),
  processClaimTransaction: (foodId: string, quantityToReduce: number, claimData: ClaimHistoryItem) => 
    sendRequest<any>('PROCESS_CLAIM', { foodId, quantityToReduce, claimData }),
  updateClaimStatus: (id: string, status: string, additionalData?: any) => 
    sendRequest<any>('UPDATE_CLAIM_STATUS', { id, status, additionalData }),

  // --- FEATURES ---
  submitReview: (claimId: string, rating: number, review: string, reviewMedia?: string[]) => 
    sendRequest<any>('SUBMIT_REVIEW', { claimId, rating, review, reviewMedia }),
  
  submitReport: (claimId: string, reason: string, description: string, evidence?: string | string[]) =>
    sendRequest<any>('SUBMIT_REPORT', { claimId, reason, description, evidence }),
  
  verifyOrderQR: (uniqueCode: string, providerName?: string) => 
    sendRequest<any>('VERIFY_ORDER_QR', { uniqueCode, scannedByProviderName: providerName }),
    
  getProviderDashboard: (providerName: string) => 
    sendRequest<any>('GET_PROVIDER_DASHBOARD', { providerName }),
  updateReportStatus: (id: string, status: string) =>
    sendRequest<any>('UPDATE_REPORT_STATUS', { id, status }),

  // --- UTILS ---
  getFAQs: () => sendRequest<FAQItem[]>('GET_FAQS'),
  getNotifications: (userId: string, role: string) => sendRequest<Notification[]>('GET_NOTIFICATIONS', { userId, role }),
  markNotificationRead: (userId: string, notifId: string) => sendRequest<any>('MARK_NOTIF_READ', { userId, notifId }),
  getBroadcasts: () => sendRequest<BroadcastMessage[]>('GET_BROADCASTS'),
  sendBroadcast: (message: BroadcastMessage, actor: any) => sendRequest<BroadcastMessage>('SEND_BROADCAST', { message, actor }),
  initDB: () => sendRequest<string>('INIT_DB'),
  getSettings: () => sendRequest<any>('GET_SETTINGS'),
  updateSettings: (settings: any, actor: any) => sendRequest<any>('UPDATE_SETTINGS', { settings, actor }),
  getSocialImpact: (userId: string) => sendRequest<any>('GET_SOCIAL_IMPACT', { userId }),
  getImpactChart: (userId: string, period: string = '7d') => sendRequest<any>('GET_IMPACT_CHART', { userId, period }),
  getFoodRequests: (receiverId?: string) => sendRequest<any[]>('GET_FOOD_REQUESTS', { receiverId }),
  addFoodRequest: (data: any) => sendRequest<any>('ADD_FOOD_REQUEST', data),
  deleteFoodRequest: (id: string) => sendRequest<any>('DELETE_FOOD_REQUEST', { id }),
  getPointHistory: (userId: string) => sendRequest<any[]>('GET_POINT_HISTORY', { userId }),
  getBadges: (role?: string) => sendRequest<any[]>('GET_BADGES', { role }),
  updateSelectedBadge: (userId: string, badgeId: string) => sendRequest<any>('UPDATE_SELECTED_BADGE', { userId, badgeId }),
  getAdminDashboard: () => sendRequest<any>('GET_ADMIN_DASHBOARD'),
  getAdminImpact: (period: string) => sendRequest<any>('GET_ADMIN_IMPACT', { period }),
  getAdminTargets: () => sendRequest<any[]>('GET_ADMIN_TARGETS'),
  updateAdminTarget: (metricKey: string, value: number, actor: any) => sendRequest<any>('UPDATE_ADMIN_TARGET', { metricKey, value, actor }),
  upsertFAQ: (faq: any, actor: any) => sendRequest<any>('UPSERT_FAQ', { faq, actor }),
  deleteFAQ: (id: any, actor: any) => sendRequest<any>('DELETE_FAQ', { id, actor }),
  assignVolunteer: (claimId: any, volunteerId: any, volunteerName: string, actor: any) => sendRequest<any>('ASSIGN_VOLUNTEER', { claimId, volunteerId, volunteerName, actor }),
  getAdmins: () => sendRequest<AdminUser[]>('GET_ADMINS'),
  getSystemLogs: () => sendRequest<SystemLog[]>('GET_SYSTEM_LOGS'),
  upsertAdmin: (admin: any, actor: any) => sendRequest<any>('UPSERT_ADMIN', { admin, actor }),
  deleteAdmin: (id: string, actor: any) => sendRequest<any>('DELETE_ADMIN', { id, actor }),
};
