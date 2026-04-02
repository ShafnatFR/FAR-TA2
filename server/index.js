const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// --- GLOBAL STATE ---
let appSettings = { disableExpiryLogic: false };

// --- HELPER: Action Router ---
// Mirrored from GAS doPost structure to make it easy to refactor frontend db.ts
app.post('/api', async (req, res) => {
    const { action, data } = req.body;
    console.log(`[ACTION] ${action}`);

    try {
        let result;
        switch (action) {
            case 'REGISTER_USER': result = await registerUser(data); break;
            case 'LOGIN_USER': result = await loginUser(data); break;
            case 'GET_USERS': 
                const users = await getAllData('users'); 
                result = users.map(u => ({ ...u, joinDate: u.created_at || new Date().toISOString() })); 
                break;
            case 'UPSERT_USER': result = await upsertUser(data); break;
            
            case 'GET_ADDRESSES': result = await getAddresses(data.userId); break;
            case 'ADD_ADDRESS': result = await addAddress(data); break;
            case 'UPDATE_ADDRESS': result = await updateAddress(data); break;
            case 'DELETE_ADDRESS': result = await deleteData('addresses', data.id); break;

            case 'GET_INVENTORY': result = await getInventory(data.providerId); break;
            case 'ADD_FOOD_ITEM': result = await addFoodItem(data); break;
            case 'UPDATE_FOOD_STOCK': result = await updateFoodStock(data.id, data.newQuantity); break;
            case 'UPDATE_FOOD_ITEM': result = await updateFoodItem(data); break;
            case 'DELETE_FOOD_ITEM': result = await deleteData('inventory', data.id); break;

            case 'GET_CLAIMS': result = await getClaims(data.providerId, data.receiverId); break;
            case 'PROCESS_CLAIM': result = await processClaim(data); break;
            case 'UPDATE_CLAIM_STATUS': result = await updateClaimStatus(data.id || data.claimId, data.status, data.additionalData); break;
            case 'VERIFY_ORDER_QR': result = await verifyOrderQR(data); break;
            case 'SUBMIT_REVIEW': result = await submitReview(data); break;
            case 'SUBMIT_REPORT': result = await submitReport(data); break;
            case 'UPDATE_REPORT_STATUS': result = await updateReportStatus(data.id, data.status); break;

            case 'GET_FAQS': result = await getAllData('faqs'); break;
            case 'GET_NOTIFICATIONS': 
                result = await getUserNotifications(data.userId, data.role); 
                break;
            case 'MARK_NOTIF_READ':
                result = await markNotificationRead(data.userId, data.notifId);
                break;
            case 'SEND_BROADCAST': 
                result = await sendBroadcast(data.message || data, data.actor); 
                break;
            
            case 'GET_SETTINGS': result = appSettings; break;
            case 'UPDATE_SETTINGS': 
                appSettings = { ...appSettings, ...(data.settings || data) };
                await logAction(data.actor?.id, data.actor?.name, 'Update Settings', `Ubah pengaturan sistem: ${Object.keys(data.settings || data).join(', ')}`);
                result = appSettings; 
                break;

            case 'GET_SOCIAL_IMPACT': result = await getSocialImpact(data.userId); break;
            case 'GET_IMPACT_CHART': result = await getImpactChart(data.userId, data.period); break;
            
            case 'GET_FOOD_REQUESTS': result = await getFoodRequests(data.receiverId); break;
            case 'ADD_FOOD_REQUEST': result = await addFoodRequest(data); break;
            case 'DELETE_FOOD_REQUEST': result = await deleteData('food_requests', data.id); break;

            case 'GET_POINT_HISTORY': result = await getPointHistory(data.userId); break;
            case 'GET_BADGES': result = await getBadges(data.role); break;
            case 'UPDATE_SELECTED_BADGE': 
                await db.query('UPDATE users SET selected_badge_id = ? WHERE id = ?', [data.badgeId, data.userId]);
                result = { success: true, badgeId: data.badgeId };
                break;

            case 'GET_ADMIN_DASHBOARD': result = await getAdminDashboard(); break;
            case 'GET_ADMIN_IMPACT': result = await getAdminImpact(data.period); break;
            case 'GET_ADMIN_TARGETS': result = await getAdminTargets(); break;
            case 'UPDATE_ADMIN_TARGET': 
                result = await updateAdminTarget(data.metricKey, data.value); 
                await logAction(data.actor?.id, data.actor?.name, 'Update Target', `Ubah target ${data.metricKey} menjadi ${data.value}`);
                break;
            case 'UPSERT_FAQ': 
                result = await upsertFAQ(data.faq); 
                await logAction(data.actor?.id, data.actor?.name, 'Upsert FAQ', `Simpan FAQ: ${data.faq.question.substring(0, 30)}...`);
                break;
            case 'DELETE_FAQ': 
                result = await deleteFAQ(data.id); 
                await logAction(data.actor?.id, data.actor?.name, 'Delete FAQ', `Hapus FAQ ID: ${data.id}`, 'warning');
                break;
            case 'ASSIGN_VOLUNTEER': 
                result = await assignVolunteer(data.claimId, data.volunteerId, data.volunteerName); 
                await logAction(data.actor?.id, data.actor?.name, 'Assign Volunteer', `Tugaskan ${data.volunteerName} ke Klaim #${data.claimId}`);
                break;

            case 'GET_ADMINS': result = await getAdmins(); break;
            case 'GET_SYSTEM_LOGS': result = await getSystemLogs(); break;
            case 'UPSERT_ADMIN': result = await upsertAdmin(data.admin, data.actor); break;
            case 'DELETE_ADMIN': result = await deleteAdmin(data.id, data.actor); break;

            case 'UPLOAD_IMAGE': 
                const { uploadToFileSystem } = require('./fileService');
                const targetFolder = data.folderType || 'fotoProfil'; 
                const filePath = await uploadToFileSystem(data.base64, data.filename, targetFolder); 
                // Return full URL (assuming backend is on same host)
                result = `http://localhost:${port}${filePath}`;
                break;

            default:
                return res.status(400).json({ status: 'error', message: `Action '${action}' not found` });
        }

        res.json({ status: 'success', data: result });
    } catch (error) {
        console.error(`[ERROR] ${action}:`, error);
        
        let statusCode = error.statusCode || 500;
        
        // Fallback mapping for generic errors that don't have a status code set
        if (!error.statusCode) {
            const msg = error.message.toLowerCase();
            if (msg.includes('email atau password salah') || msg.includes('tidak valid')) {
                statusCode = 401;
            } else if (msg.includes('sudah terdaftar')) {
                statusCode = 409;
            } else if (msg.includes('not found') || msg.includes('tidak ditemukan')) {
                statusCode = 404;
            } else if (msg.includes('stock not enough') || msg.includes('must have')) {
                statusCode = 400;
            }
        }
        
        res.status(statusCode).json({ status: 'error', message: error.message });
    }
});

// --- HELPERS ---
const ROLE_MAP = {
    'provider': 'DONATUR',
    'receiver': 'PENERIMA',
    'volunteer': 'RELAWAN',
    'admin_manager': 'ADMIN',
    'super_admin': 'SUPER_ADMIN'
};

const mapRole = (role) => ROLE_MAP[role] || role;

async function logAction(actorId, actorName, action, details, severity = 'info') {
    try {
        await db.query(
            'INSERT INTO system_logs (actor_id, actor_name, action, details, severity) VALUES (?, ?, ?, ?, ?)',
            [actorId || 0, actorName || 'System', action, details, severity]
        );
        console.log(`[LOG] ${action} by ${actorName}`);
    } catch (err) {
        console.error('[LOG ERROR]', err);
    }
}

// --- IMPLEMENTATIONS ---

async function registerUser(data) {
    const { name, email, password, role, phone, avatar } = data;
    // Check if email exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
        const err = new Error('Email ini sudah terdaftar.');
        err.statusCode = 409;
        throw err;
    }

    const [result] = await db.query(
        'INSERT INTO users (name, email, password, role, phone, avatar, points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, password, mapRole(role), phone, avatar, 0, 'ACTIVE']
    );
    return { id: result.insertId, ...data, isNewUser: true, status: 'ACTIVE', points: 0 };
}

async function loginUser(data) {
    const { email, password } = data;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) {
        const err = new Error('Email atau Password salah.');
        err.statusCode = 401;
        throw err;
    }
    const user = rows[0];
    delete user.password;
    // Reverse map role if needed for frontend
    const reverseRole = Object.keys(ROLE_MAP).find(key => ROLE_MAP[key] === user.role);
    if (reverseRole) user.role = reverseRole;
    user.isNewUser = true; 
    return user;
}

async function getAllData(table) {
    const [rows] = await db.query(`SELECT * FROM ${table}`);
    return rows;
}

async function upsertUser(data) {
    const { id, syncAddressIds, ...fields } = data;
    if (id) {
        // 1. Fetch current data for comparison
        const [oldUsers] = await db.query('SELECT name, phone, avatar FROM users WHERE id = ?', [id]);
        const oldUser = oldUsers[0];

        const updates = [];
        const values = [];
        const validColumns = ['name', 'email', 'role', 'phone', 'avatar', 'points', 'status', 'password', 'selected_badge_id'];

        let newName = oldUser?.name;
        let newPhone = oldUser?.phone;

        for (const [key, value] of Object.entries(fields)) {
            if (validColumns.includes(key) && value !== undefined) {
                let finalValue = value;
                if (key === 'role') finalValue = mapRole(value);
                if (key === 'status') finalValue = String(value).toUpperCase();

                if (key === 'name') newName = value;
                if (key === 'phone') {
                    finalValue = String(value).replace(/\D/g, '');
                    newPhone = finalValue;
                }

                updates.push(`${key} = ?`);
                values.push(finalValue);
            }
        }

        if (updates.length > 0) {
            values.push(id);
            await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

            if (fields.avatar && oldUser.avatar && fields.avatar !== oldUser.avatar) {
                const { deleteFile } = require('./fileService');
                await deleteFile(oldUser.avatar);
            }

            // 2. GRANULAR Synchronize Addresses if syncConfigs provided
            // syncConfigs: { [addressId]: { name: boolean, phone: boolean } }
            if (data.syncConfigs && typeof data.syncConfigs === 'object') {
                for (const [addrId, config] of Object.entries(data.syncConfigs)) {
                    const addrUpdates = [];
                    const addrValues = [];
                    if (config.name) {
                        addrUpdates.push('contact_name = ?');
                        addrValues.push(newName);
                    }
                    if (config.phone) {
                        addrUpdates.push('contact_phone = ?');
                        addrValues.push(newPhone);
                    }

                    if (addrUpdates.length > 0) {
                        console.log(`[SYNC] Updating address ${addrId} with fields:`, config);
                        addrValues.push(id, addrId);
                        await db.query(
                            `UPDATE addresses SET ${addrUpdates.join(', ')} WHERE user_id = ? AND id = ?`,
                            addrValues
                        );
                    }
                }
            }
        }
        return data;
    } else {
        return registerUser(data);
    }
}

async function getAddresses(userId) {
    const query = userId ? 'SELECT id, user_id as userId, label, full_address as fullAddress, contact_name as contactName, contact_phone as contactPhone, is_primary as isPrimary, latitude as lat, longitude as lng FROM addresses WHERE user_id = ?' : 'SELECT * FROM addresses';
    const [rows] = await db.query(query, [userId]);
    return rows.map(r => ({ ...r, isPrimary: !!r.isPrimary }));
}

async function addAddress(data) {
    const { userId, label, fullAddress, contactName, contactPhone, isPrimary, lat, lng } = data;
    if (isPrimary) {
        await db.query('UPDATE addresses SET is_primary = FALSE WHERE user_id = ?', [userId]);
    }
    const [result] = await db.query(
        'INSERT INTO addresses (user_id, label, full_address, contact_name, contact_phone, is_primary, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, label, fullAddress, contactName, contactPhone, isPrimary ? 1 : 0, lat, lng]
    );
    return { id: result.insertId, ...data };
}

async function updateAddress(data) {
    console.log(`[DB] Updating address ID: ${data.id}`);
    const { id, userId, label, fullAddress, contactName, contactPhone, isPrimary, lat, lng } = data;
    if (isPrimary) {
        await db.query('UPDATE addresses SET is_primary = FALSE WHERE user_id = ?', [userId]);
    }
    await db.query(
        'UPDATE addresses SET label=?, full_address=?, contact_name=?, contact_phone=?, is_primary=?, latitude=?, longitude=? WHERE id=?',
        [label, fullAddress, contactName, contactPhone, isPrimary ? 1 : 0, lat, lng, id]
    );
    return data;
}

async function getInventory(providerId) {
    // Join logic as per foodairescue.sql schema
    // Fields: id, provider_id, name, description, initial_quantity, current_quantity, min_quantity, max_quantity, 
    // expiry_time, distribution_start_time, distribution_end_time, delivery_method, status, image_url, created_at, updated_at
    let query = `
        SELECT f.id, f.provider_id as providerId, f.name, f.description, 
               f.initial_quantity as initialQuantity, f.current_quantity as currentQuantity, 
               f.min_quantity as minQuantity, f.max_quantity as maxQuantity,
               f.expiry_time as expiryTime, f.image_url as imageUrl, 
               f.delivery_method as deliveryMethod, f.status,
               f.distribution_start_time as distributionStart,
               f.distribution_end_time as distributionEnd,
               f.created_at as createdAt,
               COALESCE(u.name, 'Donatur FAR') as providerName, 
               COALESCE(u.phone, '-') as providerPhone,
               a.latitude as lat, a.longitude as lng, a.full_address as address, a.id as addressId,
               ai.is_edible as isEdible, ai.halal_score as halalScore, ai.quality_score as qualityScore, 
               ai.reason as aiReason, ai.ingredients as aiIngredients,
               si.total_potential_points as totalPoints, si.co2_per_portion as co2Saved, 
               si.water_saved_liter as waterSaved, si.land_saved_sqm as landSaved, si.impact_details as impactDetails
        FROM food_items f
        LEFT JOIN users u ON f.provider_id = u.id
        LEFT JOIN addresses a ON f.provider_id = a.user_id AND a.is_primary = 1
        LEFT JOIN ai_verifications ai ON f.id = ai.food_id
        LEFT JOIN social_impacts si ON f.id = si.food_id
    `;
    const params = [];
    if (providerId) {
        query += ' WHERE f.provider_id = ?';
        params.push(providerId);
    } else {
        // For receivers, only show available items with stock
        // Lenient on status case and handle empty strings if any
        query += ' WHERE (f.status = "AVAILABLE" OR f.status IS NULL OR f.status = "") AND f.current_quantity > 0';
    }

    // Newest items first
    query += ' ORDER BY f.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows.map(item => ({
        ...item,
        status: (item.status || 'available').toLowerCase(),
        deliveryMethod: (item.deliveryMethod || 'pickup').toLowerCase(),
        location: item.lat ? {
            lat: item.lat,
            lng: item.lng,
            address: item.address,
            addressId: item.addressId
        } : {
            address: 'Lokasi tidak tersedia',
            lat: -6.914744,
            lng: 107.609810
        },
        aiVerification: item.halalScore !== null ? {
            isEdible: !!item.isEdible,
            halalScore: item.halalScore,
            qualityScore: item.qualityScore,
            reason: item.aiReason,
            ingredients: item.aiIngredients ? (typeof item.aiIngredients === 'string' ? JSON.parse(item.aiIngredients) : item.aiIngredients) : []
        } : { isEdible: true, halalScore: 90 }, // Default if missing
        socialImpact: item.totalPoints !== null ? {
            totalPoints: item.totalPoints,
            co2Saved: item.co2Saved,
            waterSaved: item.waterSaved,
            landSaved: item.landSaved,
            wasteReduction: item.co2Saved ? parseFloat((item.co2Saved * 0.45).toFixed(2)) : 0, 
            impactDetails: item.impactDetails ? (typeof item.impactDetails === 'string' ? JSON.parse(item.impactDetails) : item.impactDetails) : []
        } : null
    }));
}

async function addFoodItem(data) {
    const { providerId, name, description, initialQuantity, currentQuantity, expiryTime, imageUrl, deliveryMethod, aiVerification, socialImpact } = data;
    
    // Parse distribution times from frontend datetime-local format
    let distStart = '08:00:00';
    let distEnd = '20:00:00';
    let expiryDateTime = expiryTime;
    
    if (data.distributionStart) {
        // Format: "2026-03-30T18:30" → extract time or use full datetime
        distStart = data.distributionStart.includes('T') 
            ? data.distributionStart.split('T')[1] + ':00'
            : data.distributionStart;
    }
    if (data.distributionEnd) {
        distEnd = data.distributionEnd.includes('T') 
            ? data.distributionEnd.split('T')[1] + ':00'
            : data.distributionEnd;
        // Use distributionEnd as expiry if expiryTime is just a time string
        if (data.distributionEnd.includes('T')) {
            expiryDateTime = data.distributionEnd.replace('T', ' ') + ':00';
        }
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert food_items
        const [foodResult] = await connection.query(
            'INSERT INTO food_items (provider_id, name, description, initial_quantity, current_quantity, min_quantity, max_quantity, expiry_time, distribution_start_time, distribution_end_time, delivery_method, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [providerId, name, description, initialQuantity, currentQuantity, data.minQuantity || 1, data.maxQuantity || initialQuantity, expiryDateTime, distStart, distEnd, deliveryMethod.toUpperCase(), imageUrl]
        );
        const foodId = foodResult.insertId;

        // 2. Insert ai_verifications (if AI data exists)
        if (aiVerification) {
            const isEdible = aiVerification.isEdible ? 1 : 0;
            const halalScore = aiVerification.halalScore || 0;
            const qualityScore = aiVerification.qualityScore || halalScore;
            const reason = aiVerification.reason || '';
            const ingredients = JSON.stringify(aiVerification.ingredients || []);

            await connection.query(
                'INSERT INTO ai_verifications (food_id, is_edible, halal_score, quality_score, reason, ingredients) VALUES (?, ?, ?, ?, ?, ?)',
                [foodId, isEdible, halalScore, qualityScore, reason, ingredients]
            );
            console.log(`[ADD_FOOD] AI Verification saved for food_id: ${foodId}`);
        }

        // 3. Insert social_impacts (if impact data exists)
        if (socialImpact) {
            const totalPotentialPoints = socialImpact.totalPoints || 0;
            const co2PerPortion = socialImpact.co2PerPortion || socialImpact.co2Saved || 0;
            const waterSaved = socialImpact.waterSaved || 0;
            const landSaved = socialImpact.landSaved || 0;
            
            // Store full breakdown data as JSON for future reference
            const impactDetails = JSON.stringify({
                co2Breakdown: socialImpact.co2Breakdown || [],
                socialBreakdown: socialImpact.socialBreakdown || [],
                portionCount: socialImpact.portionCount || 1,
                co2PerPortion: socialImpact.co2PerPortion || 0,
                pointsPerPortion: socialImpact.pointsPerPortion || 0,
                wasteReduction: socialImpact.wasteReduction || 0,
                level: socialImpact.level || 'Aktif'
            });

            await connection.query(
                'INSERT INTO social_impacts (food_id, total_potential_points, co2_per_portion, water_saved_liter, land_saved_sqm, impact_details) VALUES (?, ?, ?, ?, ?, ?)',
                [foodId, totalPotentialPoints, co2PerPortion, waterSaved, landSaved, impactDetails]
            );
            console.log(`[ADD_FOOD] Social Impact saved for food_id: ${foodId}`);
        }

        await connection.commit();
        console.log(`[ADD_FOOD] Successfully saved food_id: ${foodId} with AI verification and social impact`);
        return { id: foodId, ...data };
    } catch (error) {
        await connection.rollback();
        console.error('[ADD_FOOD] Transaction failed:', error);
        throw error;
    } finally {
        connection.release();
    }
}

async function updateFoodStock(id, newQuantity) {
    await db.query('UPDATE food_items SET current_quantity = ? WHERE id = ?', [newQuantity, id]);
    return { id, newQuantity };
}

async function updateFoodItem(data) {
    const { id, name, description, currentQuantity, expiryTime, imageUrl, deliveryMethod, status } = data;
    await db.query(
        'UPDATE food_items SET name=?, description=?, current_quantity=?, expiry_time=?, image_url=?, delivery_method=?, status=? WHERE id=?',
        [name, description, currentQuantity, expiryTime, imageUrl, deliveryMethod.toUpperCase(), status.toUpperCase(), id]
    );
    return data;
}

async function deleteData(table, id) {
    const tableName = table === 'inventory' ? 'food_items' : table;
    await db.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    return { id, status: 'deleted' };
}

async function getClaims(providerId, receiverId) {
    let query = `
        SELECT c.*, f.name as foodName, f.image_url as imageUrl,
               u_prov.name as providerName, u_prov.phone as donorPhone,
               u_rec.name as receiverName, u_rec.phone as receiverPhone,
               a_prov.latitude as prov_lat, a_prov.longitude as prov_lng, a_prov.full_address as prov_addr,
               a_prov.contact_name as prov_contact, a_prov.contact_phone as prov_phone, a_prov.label as prov_label,
               a_rec.latitude as rec_lat, a_rec.longitude as rec_lng, a_rec.full_address as rec_addr,
               a_rec.contact_name as rec_contact, a_rec.contact_phone as rec_phone, a_rec.label as rec_label,
               rev.rating as rating, rev.comment as review, rev.review_media as reviewMedia,
               rep.id as reportId, rep.category as reportReason, rep.description as reportDescription,
               rep.evidence_photo as reportEvidence, rep.status as reportStatus,
               u_reporter.phone as reporterPhone
        FROM claims c 
        JOIN food_items f ON c.food_id = f.id 
        JOIN users u_prov ON f.provider_id = u_prov.id
        JOIN users u_rec ON c.receiver_id = u_rec.id
        LEFT JOIN addresses a_prov ON f.provider_id = a_prov.user_id AND a_prov.is_primary = 1
        LEFT JOIN addresses a_rec ON c.address_id = a_rec.id
        LEFT JOIN reviews rev ON c.id = rev.claim_id
        LEFT JOIN reports rep ON c.id = rep.claim_id
        LEFT JOIN users u_reporter ON rep.reporter_id = u_reporter.id
        WHERE 1=1
    `;
    const params = [];
    if (providerId) {
        query += ' AND f.provider_id = ?';
        params.push(providerId);
    }
    if (receiverId) {
        query += ' AND c.receiver_id = ?';
        params.push(receiverId);
    }
    const [rows] = await db.query(query, params);
    return rows.map(c => ({
        ...c,
        status: c.status.toLowerCase(),
        foodId: c.food_id,
        receiverId: c.receiver_id,
        volunteerId: c.volunteer_id,
        claimedQuantity: String(c.claimed_quantity),
        deliveryMethod: c.delivery_method.toLowerCase(),
        uniqueCode: c.unique_code,
        isScanned: !!c.is_scanned,
        date: c.created_at, // Mapping for frontend
        receiverName: c.rec_contact || c.receiverName, 
        receiverPhone: c.rec_phone || c.receiverPhone,
        donorPhone: c.prov_phone || c.donorPhone,
        providerName: c.providerName,
        providerLocation: { lat: c.prov_lat, lng: c.prov_lng, address: c.prov_addr, label: c.prov_label },
        receiverLocation: { lat: c.rec_lat, lng: c.rec_lng, address: c.rec_addr, label: c.rec_label },
        location: { lat: c.prov_lat, lng: c.prov_lng, address: c.prov_addr, label: c.prov_label },
        // Review & Report Data
        reviewMedia: (() => {
            if (!c.reviewMedia) return [];
            if (typeof c.reviewMedia !== 'string') return c.reviewMedia;
            try { return JSON.parse(c.reviewMedia); } catch (e) { return [c.reviewMedia]; }
        })(),
        isReported: !!c.reportId,
        reportEvidence: (() => {
            if (!c.reportEvidence) return [];
            if (typeof c.reportEvidence !== 'string') return c.reportEvidence;
            try { 
                const parsed = JSON.parse(c.reportEvidence);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) { 
                // If it's a comma-separated string or just one URL
                if (c.reportEvidence.includes(',')) return c.reportEvidence.split(',').map(s => s.trim());
                return [c.reportEvidence]; 
            }
        })(),
        reportStatus: c.reportStatus || null,
        reporterPhone: c.reporterPhone || null
    }));
}

async function processClaim(payload) {
    const { foodId, quantityToReduce, claimData } = payload;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [inv] = await connection.query('SELECT current_quantity FROM food_items WHERE id = ? FOR UPDATE', [foodId]);
        if (inv.length === 0) throw new Error('Item not found');
        if (inv[0].current_quantity < quantityToReduce) throw new Error('Stock not enough');

        const newStock = inv[0].current_quantity - quantityToReduce;
        await connection.query('UPDATE food_items SET current_quantity = ? WHERE id = ?', [newStock, foodId]);

        const [addr] = await connection.query('SELECT id FROM addresses WHERE user_id = ? AND is_primary = 1 LIMIT 1', [claimData.receiverId]);
        const addressId = addr.length > 0 ? addr[0].id : null;
        if (!addressId) throw new Error('Receiver must have a primary address to claim');

        const [claimResult] = await connection.query(
            'INSERT INTO claims (food_id, receiver_id, address_id, claimed_quantity, delivery_method, status, unique_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [foodId, claimData.receiverId, addressId, quantityToReduce, claimData.deliveryMethod.toUpperCase(), 'PENDING', claimData.uniqueCode]
        );

        const claimId = claimResult.insertId;

        // NOTIFIKASI: Beritahu Provider
        const [foodItem] = await connection.query('SELECT provider_id, name FROM food_items WHERE id = ?', [foodId]);
        if (foodItem.length > 0) {
            await createNotification(
                foodItem[0].provider_id, 
                'warning', 
                'Pesanan Masuk!', 
                `Seseorang baru saja mengklaim menu "${foodItem[0].name}". Mohon segera siapkan.`,
                claimId
            );
        }

        // NOTIFIKASI: Beritahu Penerima (Konfirmasi)
        await createNotification(
            claimData.receiverId,
            'success',
            'Klaim Berhasil',
            `Klaim untuk "${foodItem[0]?.name || 'makanan'}" sedang diproses. Simpan kode Anda: ${claimData.uniqueCode}`,
            claimId
        );

        await connection.commit();
        return { success: true, newStock, claimId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function updateClaimStatus(id, status, additionalData) {
    // Map 'active' from frontend to 'IN_PROGRESS' for DB enum
    let dbStatus = status ? status.toUpperCase() : 'PENDING';
    if (dbStatus === 'ACTIVE') dbStatus = 'IN_PROGRESS';
    
    // Ensure it's one of the valid ENUM values
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(dbStatus)) {
        dbStatus = 'PENDING';
    }

    let query = 'UPDATE claims SET status = ?';
    const params = [dbStatus];

    if (additionalData) {
        if (additionalData.volunteerId !== undefined) {
            query += ', volunteer_id = ?';
            params.push(additionalData.volunteerId);
        }
        if (additionalData.courierName !== undefined) {
            query += ', courier_name = ?';
            params.push(additionalData.courierName);
        }
        if (additionalData.courierStatus !== undefined) {
            query += ', courier_status = ?';
            params.push(additionalData.courierStatus.toLowerCase());
        }
        if (additionalData.isScanned !== undefined) {
            query += ', is_scanned = ?';
            params.push(additionalData.isScanned ? 1 : 0);
        }
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);

    // --- TRIGGER NOTIFIKASI BERDASARKAN UPDATE ---
    const [c] = await db.query('SELECT c.*, f.name as foodName FROM claims c JOIN food_items f ON c.food_id = f.id WHERE c.id = ?', [id]);
    if (c.length > 0) {
        const claim = c[0];
        
        // A. Jika Status Berubah ke COMPLETED
        if (dbStatus === 'COMPLETED') {
            await createNotification(claim.receiver_id, 'success', 'Donasi Selesai!', `Donasi "${claim.foodName}" telah sukses diterima. Terima kasih telah membantu mengurangi food waste!`, id);
            await createNotification(claim.provider_id, 'success', 'Donasi Terkirim!', `Menu "${claim.foodName}" telah selesai diterima oleh penerima.`, id);
            if (claim.volunteer_id) {
                await createNotification(claim.volunteer_id, 'success', 'Misi Sukses!', `Bagus! Pengantaran "${claim.foodName}" telah diverifikasi oleh penerima.`, id);
            }
        }
        
        // B. Jika Kurir/Relawan Sedang Menjemput (Picking Up)
        if (additionalData?.courierStatus === 'picking_up') {
            await createNotification(claim.receiver_id, 'info', 'Kurir Sedang Menuju Lokasi', `Relawan sedang menjemput donasi "${claim.foodName}" untuk diantar ke Anda.`, id);
        }
    }

    return { id, status: dbStatus, ...additionalData };
}

async function verifyOrderQR(data) {
    const { uniqueCode } = data;
    const [rows] = await db.query('SELECT * FROM claims WHERE unique_code = ?', [uniqueCode]);
    if (rows.length === 0) throw new Error('Kode tidak valid');
    if (rows[0].is_scanned) return { success: false, message: 'ALREADY_SCANNED' };

    await db.query('UPDATE claims SET is_scanned = 1, status = "COMPLETED" WHERE id = ?', [rows[0].id]);
    return { success: true, message: 'VERIFIED', claimId: rows[0].id };
}

async function submitReview(data) {
    const { claimId, rating, review, reviewMedia } = data;
    const [claim] = await db.query('SELECT * FROM claims WHERE id = ?', [claimId]);
    if (claim.length === 0) throw new Error('Claim not found');
    
    const [food] = await db.query('SELECT provider_id FROM food_items WHERE id = ?', [claim[0].food_id]);
    
    await db.query(
        'INSERT INTO reviews (claim_id, user_id, partner_id, food_id, rating, comment, review_media) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [claimId, claim[0].receiver_id, food[0].provider_id, claim[0].food_id, rating, review, JSON.stringify(reviewMedia)]
    );
    return { status: 'success' };
}

async function submitReport(data) {
    const { claimId, reason, description, evidence } = data;
    const [claim] = await db.query('SELECT receiver_id FROM claims WHERE id = ?', [claimId]);
    await db.query(
        'INSERT INTO reports (reporter_id, claim_id, category, description, evidence_photo, status) VALUES (?, ?, ?, ?, ?, ?)',
        [claim[0].receiver_id, claimId, reason, description, JSON.stringify(evidence), 'NEW']
    );
    return { status: 'success', claimId };
}

async function updateReportStatus(id, status) {
    // id here is the actual report DB id (numeric)
    const dbId = parseInt(String(id), 10);
    if (isNaN(dbId)) {
        throw new Error(`Invalid report ID: ${id}`);
    }
    const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    const dbStatus = status.toUpperCase();
    if (!validStatuses.includes(dbStatus)) {
        throw new Error(`Invalid report status: ${status}`);
    }
    console.log(`[UPDATE_REPORT_STATUS] id=${dbId}, status=${dbStatus}`);
    const [result] = await db.query('UPDATE reports SET status = ? WHERE id = ?', [dbStatus, dbId]);
    console.log(`[UPDATE_REPORT_STATUS] affected rows: ${result.affectedRows}`);
    if (result.affectedRows === 0) {
        throw new Error(`Report with id ${dbId} not found`);
    }
    return { id: dbId, status: dbStatus };
}

async function sendBroadcast(data) {
    const { title, content, target } = data;
    try {
        const [result] = await db.query('INSERT INTO notifications (title, content, target) VALUES (?, ?, ?)', [title, content, target.toUpperCase()]);
        return { id: result.insertId, ...data, sentAt: new Date() };
    } catch (e) {
        console.warn('Notifications table not found');
        return data;
    }
}

async function getBaseSocialImpact(userId) {
    // 1. Get Total Points from Point History (Total Nilai Kebaikan)
    const [pointRows] = await db.query(
        'SELECT SUM(amount) as total FROM point_histories WHERE user_id = ?',
        [userId]
    );
    const totalPoints = pointRows[0]?.total || 0;

    // 2. Get Environmental Impact from Claims (Real Impact: CO2, Water, Land)
    const [impactRows] = await db.query(`
        SELECT 
            SUM(si.co2_per_portion * c.claimed_quantity) as totalCo2,
            SUM(si.water_saved_liter * c.claimed_quantity) as totalWater,
            SUM(si.land_saved_sqm * c.claimed_quantity) as totalLand
        FROM claims c
        JOIN food_items f ON c.food_id = f.id
        JOIN social_impacts si ON f.id = si.food_id
        WHERE f.provider_id = ? AND c.status = 'COMPLETED'
    `, [userId]);
    const impact = impactRows[0] || {};

    // 3. Get Total Potential Points from Social Impacts (Menjaga Bumi)
    const [potentialRows] = await db.query(`
        SELECT SUM(si.total_potential_points) as total
        FROM social_impacts si
        JOIN food_items f ON si.food_id = f.id
        WHERE f.provider_id = ?
    `, [userId]);
    const totalPotentialPoints = potentialRows[0]?.total || 0;
    
    return {
        totalCo2: parseFloat((Number(impact.totalCo2) || 0).toFixed(2)),
        totalWater: parseFloat((Number(impact.totalWater) || 0).toFixed(2)),
        totalLand: parseFloat((Number(impact.totalLand) || 0).toFixed(2)),
        totalPoints: Math.round(Number(totalPoints) || 0),
        totalPotentialPoints: Math.round(Number(totalPotentialPoints) || 0),
        impactLevel: (Number(totalPoints) > 1000 ? 'SULTAN' : (Number(totalPoints) > 500 ? 'JURAGAN' : 'SAHABAT'))
    };
}

async function getImpactChart(userId, period = '7d') {
    let pointsData = [];
    let impactData = [];
    let labels = [];

    if (period === '7d') {
        labels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        // Points dari point_histories 7 hari terakhir
        const [pointRows] = await db.query(`
            SELECT DAYOFWEEK(created_at) as dw, SUM(amount) as total
            FROM point_histories
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY dw
        `, [userId]);
        pointsData = new Array(7).fill(0);
        pointRows.forEach(r => { pointsData[r.dw - 1] = Number(r.total); });

        // Potential points dari social_impacts 7 hari terakhir
        const [impactRows] = await db.query(`
            SELECT DAYOFWEEK(f.created_at) as dw, SUM(si.total_potential_points) as total
            FROM social_impacts si
            JOIN food_items f ON si.food_id = f.id
            WHERE f.provider_id = ? AND f.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY dw
        `, [userId]);
        impactData = new Array(7).fill(0);
        impactRows.forEach(r => { impactData[r.dw - 1] = Number(r.total); });

    } else if (period === '30d') {
        labels = ['M1', 'M2', 'M3', 'M4'];
        const [pointRows] = await db.query(`
            SELECT FLOOR(DATEDIFF(NOW(), created_at) / 7) as week_idx, SUM(amount) as total
            FROM point_histories
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY week_idx
        `, [userId]);
        pointsData = new Array(4).fill(0);
        pointRows.forEach(r => {
            const idx = 3 - Math.min(Math.floor(Number(r.week_idx)), 3);
            pointsData[idx] += Number(r.total);
        });

        const [impactRows] = await db.query(`
            SELECT FLOOR(DATEDIFF(NOW(), f.created_at) / 7) as week_idx, SUM(si.total_potential_points) as total
            FROM social_impacts si
            JOIN food_items f ON si.food_id = f.id
            WHERE f.provider_id = ? AND f.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY week_idx
        `, [userId]);
        impactData = new Array(4).fill(0);
        impactRows.forEach(r => {
            const idx = 3 - Math.min(Math.floor(Number(r.week_idx)), 3);
            impactData[idx] += Number(r.total);
        });

    } else if (period === '12m') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const [pointRows] = await db.query(`
            SELECT MONTH(created_at) as m, SUM(amount) as total
            FROM point_histories
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY m
        `, [userId]);
        pointsData = new Array(12).fill(0);
        pointRows.forEach(r => { pointsData[r.m - 1] = Number(r.total); });

        const [impactRows] = await db.query(`
            SELECT MONTH(f.created_at) as m, SUM(si.total_potential_points) as total
            FROM social_impacts si
            JOIN food_items f ON si.food_id = f.id
            WHERE f.provider_id = ? AND f.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY m
        `, [userId]);
        impactData = new Array(12).fill(0);
        impactRows.forEach(r => { impactData[r.m - 1] = Number(r.total); });
    }

    return { labels, pointsData, impactData };
}

async function getFoodRequests(receiverId) {
    let query = `
        SELECT fr.*, u.name as receiverName, u.avatar as receiverAvatar
        FROM food_requests fr
        JOIN users u ON fr.receiver_id = u.id
    `;
    const params = [];
    if (receiverId) {
        query += ' WHERE fr.receiver_id = ?';
        params.push(receiverId);
    } else {
        query += ' WHERE fr.status = "ACTIVE"';
    }
    query += ' ORDER BY fr.posted_date DESC';
    
    const [rows] = await db.query(query, params);
    return rows.map(r => ({
        ...r,
        postedDate: r.posted_date,
        neededQuantity: r.needed_quantity
    }));
}

async function addFoodRequest(data) {
    const { receiverId, title, description, neededQuantity } = data;
    const [result] = await db.query(
        'INSERT INTO food_requests (receiver_id, title, description, needed_quantity, status) VALUES (?, ?, ?, ?, ?)',
        [receiverId, title, description, neededQuantity, 'ACTIVE']
    );
    return { id: result.insertId, ...data, status: 'ACTIVE', postedDate: new Date() };
}

async function getPointHistory(userId) {
    const [rows] = await db.query(
        'SELECT * FROM point_histories WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
    );
    return rows.map(r => ({
        ...r,
        date: r.created_at,
        type: r.activity_type
    }));
}

async function getAdminDashboard() {
    // 1. Aggregate REAL impact stats from completed claims + social_impacts
    const [impactRows] = await db.query(`
        SELECT 
            COALESCE(SUM(si.co2_per_portion * c.claimed_quantity * 0.45), 0) as totalSavedKg,
            COALESCE(SUM(si.co2_per_portion * c.claimed_quantity), 0) as totalCo2Saved,
            COUNT(DISTINCT c.receiver_id) as uniqueBeneficiaries,
            COUNT(c.id) as completedClaims
        FROM claims c
        JOIN food_items f ON c.food_id = f.id
        LEFT JOIN social_impacts si ON f.id = si.food_id
        WHERE c.status = 'COMPLETED'
    `);
    const impact = impactRows[0] || {};

    // 2. Total claims count (all statuses)
    const [claimCountRows] = await db.query('SELECT COUNT(*) as total FROM claims');
    const totalClaims = claimCountRows[0]?.total || 0;

    // 3. Active inventory
    const [invRows] = await db.query(`
        SELECT COUNT(*) as activeInventory 
        FROM food_items 
        WHERE (status = 'AVAILABLE' OR status IS NULL) AND current_quantity > 0
    `);
    const activeInventory = invRows[0]?.activeInventory || 0;

    // 4. Report counts by status
    const [reportRows] = await db.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) as newCount,
            SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as inProgressCount,
            SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolvedCount,
            SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejectedCount
        FROM reports
    `);
    const reports = reportRows[0] || {};
    const pendingReports = (Number(reports.newCount) || 0) + (Number(reports.inProgressCount) || 0);

    // 5. User counts by role
    const [userRoleRows] = await db.query(`
        SELECT role, COUNT(*) as count FROM users GROUP BY role
    `);
    const totalUsers = userRoleRows.reduce((sum, r) => sum + Number(r.count), 0);
    const usersByRole = {};
    userRoleRows.forEach(r => {
        const frontendRole = Object.keys(ROLE_MAP).find(k => ROLE_MAP[k] === r.role) || r.role;
        usersByRole[frontendRole] = Number(r.count);
    });

    // 6. Top 5 Donatur by completed claims weight
    const [topDonorRows] = await db.query(`
        SELECT u.id, u.name, u.avatar,
               COUNT(c.id) as totalDonations,
               COALESCE(SUM(si.co2_per_portion * c.claimed_quantity * 0.45), 0) as totalKg
        FROM claims c
        JOIN food_items f ON c.food_id = f.id
        JOIN users u ON f.provider_id = u.id
        LEFT JOIN social_impacts si ON f.id = si.food_id
        WHERE c.status = 'COMPLETED'
        GROUP BY u.id, u.name, u.avatar
        ORDER BY totalKg DESC
        LIMIT 5
    `);

    // 7. Trend data: last 7 days comparison
    const [trendRows] = await db.query(`
        SELECT 
            DATE(c.created_at) as date,
            COALESCE(SUM(si.co2_per_portion * c.claimed_quantity * 0.45), 0) as wasteKg,
            COALESCE(SUM(si.co2_per_portion * c.claimed_quantity), 0) as co2Kg,
            COUNT(c.id) as transactions
        FROM claims c
        JOIN food_items f ON c.food_id = f.id
        LEFT JOIN social_impacts si ON f.id = si.food_id
        WHERE c.status = 'COMPLETED'
        AND c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(c.created_at)
        ORDER BY date
    `);

    // Previous 7 days for growth comparison
    const [prevTrendRows] = await db.query(`
        SELECT 
            COALESCE(SUM(si.co2_per_portion * c.claimed_quantity * 0.45), 0) as wasteKg,
            COUNT(c.id) as transactions
        FROM claims c
        JOIN food_items f ON c.food_id = f.id
        LEFT JOIN social_impacts si ON f.id = si.food_id
        WHERE c.status = 'COMPLETED'
        AND c.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
        AND c.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    const prevPeriod = prevTrendRows[0] || {};
    const currentWasteKg = trendRows.reduce((sum, r) => sum + Number(r.wasteKg), 0);
    const prevWasteKg = Number(prevPeriod.wasteKg) || 0;
    const growthPercent = prevWasteKg > 0 ? ((currentWasteKg - prevWasteKg) / prevWasteKg * 100).toFixed(1) : null;

    // 8. Expiring Soon (< 24 hours)
    const [expiringRows] = await db.query(`
        SELECT f.id, f.name, f.expiry_time as expiryTime, f.current_quantity as qty, u.name as providerName
        FROM food_items f
        JOIN users u ON f.provider_id = u.id
        WHERE f.status = 'AVAILABLE' 
        AND f.current_quantity > 0
        AND f.expiry_time <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
        AND f.expiry_time > NOW()
        ORDER BY f.expiry_time ASC
        LIMIT 5
    `);

    // 9. Recent Activities from DB (last 10 mixed)
    const [recentClaimRows] = await db.query(`
        SELECT 'claim' as type, c.id, f.name as foodName, u_prov.name as actorName, 
               c.created_at as date, c.status,
               CASE WHEN c.status = 'COMPLETED' THEN 'Transaksi Selesai'
                    WHEN c.status = 'IN_PROGRESS' THEN 'Klaim Diproses'
                    ELSE 'Klaim Baru' END as description
        FROM claims c 
        JOIN food_items f ON c.food_id = f.id
        JOIN users u_prov ON f.provider_id = u_prov.id
        ORDER BY c.created_at DESC LIMIT 5
    `);
    const [recentFoodRows] = await db.query(`
        SELECT 'food' as type, f.id, f.name as foodName, u.name as actorName,
               f.created_at as date, 'AVAILABLE' as status,
               CONCAT('Stok: ', f.current_quantity, ' porsi') as description
        FROM food_items f
        JOIN users u ON f.provider_id = u.id
        ORDER BY f.created_at DESC LIMIT 5
    `);
    const [recentUserRows] = await db.query(`
        SELECT 'user' as type, u.id, u.name as foodName, u.name as actorName,
               u.created_at as date, u.role as status,
               CONCAT('Role: ', u.role) as description
        FROM users u
        ORDER BY u.created_at DESC LIMIT 5
    `);
    const [recentReportRows] = await db.query(`
        SELECT 'report' as type, r.id, COALESCE(r.category, 'Laporan') as foodName,
               u.name as actorName,
               r.created_at as date, r.status,
               COALESCE(r.description, 'Laporan baru masuk') as description
        FROM reports r
        JOIN users u ON r.reporter_id = u.id
        ORDER BY r.created_at DESC LIMIT 3
    `);

    // Merge and sort all activities
    const allActivities = [...recentClaimRows, ...recentFoodRows, ...recentUserRows, ...recentReportRows]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);

    // Build sparkline data for stat cards (last 7 days)
    const dayLabels = [];
    const wasteSparkline = new Array(7).fill(0);
    const co2Sparkline = new Array(7).fill(0);
    const claimSparkline = new Array(7).fill(0);
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        dayLabels.push(dayNames[d.getDay()]);
    }
    trendRows.forEach(r => {
        const rd = new Date(r.date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - rd.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
            const idx = 6 - diffDays;
            wasteSparkline[idx] = Number(r.wasteKg);
            co2Sparkline[idx] = Number(r.co2Kg);
            claimSparkline[idx] = Number(r.transactions);
        }
    });

    return {
        stats: {
            totalSavedKg: parseFloat(Number(impact.totalSavedKg || 0).toFixed(1)),
            totalCo2Saved: parseFloat(Number(impact.totalCo2Saved || 0).toFixed(1)),
            uniqueBeneficiaries: Number(impact.uniqueBeneficiaries) || 0,
            completedClaims: Number(impact.completedClaims) || 0,
            totalClaims,
            activeInventory,
            totalUsers,
            pendingReports,
            totalReports: Number(reports.total) || 0,
        },
        usersByRole,
        topDonors: topDonorRows.map(d => ({
            id: d.id,
            name: d.name,
            avatar: d.avatar,
            totalDonations: Number(d.totalDonations),
            totalKg: parseFloat(Number(d.totalKg).toFixed(1))
        })),
        trend: {
            labels: dayLabels,
            wasteSparkline,
            co2Sparkline,
            claimSparkline,
            growthPercent: growthPercent ? parseFloat(growthPercent) : null
        },
        expiringSoon: expiringRows,
        recentActivities: allActivities
    };
}

async function getAdminImpact(period = 'harian') {
    let labels = [];
    let wasteData = [];
    let socialData = [];
    let co2Data = [];

    if (period === 'harian') {
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            labels.push(dayNames[d.getDay()]);
        }

        const [rows] = await db.query(`
            SELECT 
                DATE(c.created_at) as date,
                COALESCE(SUM(si.co2_per_portion * c.claimed_quantity * 0.45), 0) as wasteKg,
                COALESCE(SUM(si.co2_per_portion * c.claimed_quantity), 0) as co2Kg,
                COUNT(c.id) as transactions
            FROM claims c
            JOIN food_items f ON c.food_id = f.id
            LEFT JOIN social_impacts si ON f.id = si.food_id
            WHERE c.status = 'COMPLETED'
            AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(c.created_at)
            ORDER BY date
        `);

        wasteData = new Array(7).fill(0);
        socialData = new Array(7).fill(0);
        co2Data = new Array(7).fill(0);

        rows.forEach(r => {
            const rd = new Date(r.date);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - rd.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 7) {
                const idx = 6 - diffDays;
                wasteData[idx] = parseFloat(Number(r.wasteKg).toFixed(1));
                co2Data[idx] = parseFloat(Number(r.co2Kg).toFixed(1));
                socialData[idx] = Number(r.transactions);
            }
        });

    } else if (period === 'bulanan') {
        labels = ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4'];
        const [rows] = await db.query(`
            SELECT 
                FLOOR((DAY(c.created_at) - 1) / 7) as weekIdx,
                COALESCE(SUM(si.co2_per_portion * c.claimed_quantity * 0.45), 0) as wasteKg,
                COALESCE(SUM(si.co2_per_portion * c.claimed_quantity), 0) as co2Kg,
                COUNT(c.id) as transactions
            FROM claims c
            JOIN food_items f ON c.food_id = f.id
            LEFT JOIN social_impacts si ON f.id = si.food_id
            WHERE c.status = 'COMPLETED'
            AND MONTH(c.created_at) = MONTH(CURRENT_DATE())
            AND YEAR(c.created_at) = YEAR(CURRENT_DATE())
            GROUP BY weekIdx
            ORDER BY weekIdx
        `);

        wasteData = new Array(4).fill(0);
        socialData = new Array(4).fill(0);
        co2Data = new Array(4).fill(0);

        rows.forEach(r => {
            const idx = Math.min(Number(r.weekIdx), 3);
            wasteData[idx] = parseFloat(Number(r.wasteKg).toFixed(1));
            co2Data[idx] = parseFloat(Number(r.co2Kg).toFixed(1));
            socialData[idx] = Number(r.transactions);
        });

    } else if (period === 'tahunan') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const [rows] = await db.query(`
            SELECT 
                MONTH(c.created_at) as monthIdx,
                COALESCE(SUM(si.co2_per_portion * c.claimed_quantity * 0.45), 0) as wasteKg,
                COALESCE(SUM(si.co2_per_portion * c.claimed_quantity), 0) as co2Kg,
                COUNT(c.id) as transactions
            FROM claims c
            JOIN food_items f ON c.food_id = f.id
            LEFT JOIN social_impacts si ON f.id = si.food_id
            WHERE c.status = 'COMPLETED'
            AND YEAR(c.created_at) = YEAR(CURRENT_DATE())
            GROUP BY monthIdx
            ORDER BY monthIdx
        `);

        wasteData = new Array(12).fill(0);
        socialData = new Array(12).fill(0);
        co2Data = new Array(12).fill(0);

        rows.forEach(r => {
            const idx = Number(r.monthIdx) - 1;
            wasteData[idx] = parseFloat(Number(r.wasteKg).toFixed(1));
            co2Data[idx] = parseFloat(Number(r.co2Kg).toFixed(1));
            socialData[idx] = Number(r.transactions);
        });
    }

    return { labels, wasteData, socialData, co2Data };
}

async function getAdminTargets() {
    const [rows] = await db.query('SELECT * FROM admin_targets');
    return rows;
}

async function updateAdminTarget(metricKey, value) {
    await db.query('UPDATE admin_targets SET target_value = ? WHERE metric_key = ?', [value, metricKey]);
    return { metricKey, value };
}

async function upsertFAQ(faq) {
    const { id, category, question, answer } = faq;
    // If ID starts with 'faq-', it's a temporary frontend ID, so we treat it as new (null)
    const dbId = typeof id === 'string' && id.startsWith('faq-') ? null : id;

    if (dbId) {
        await db.query(
            'UPDATE faqs SET category = ?, question = ?, answer = ? WHERE id = ?',
            [category, question, answer, dbId]
        );
        return { ...faq, id: dbId };
    } else {
        const [result] = await db.query(
            'INSERT INTO faqs (category, question, answer) VALUES (?, ?, ?)',
            [category, question, answer]
        );
        return { ...faq, id: result.insertId };
    }
}

async function deleteFAQ(id) {
    await db.query('DELETE FROM faqs WHERE id = ?', [id]);
    return { id, success: true };
}

async function assignVolunteer(claimId, volunteerId, volunteerName) {
    await db.query(
        `UPDATE claims 
         SET volunteer_id = ?, 
             courier_name = ?, 
             status = 'IN_PROGRESS', 
             courier_status = 'picking_up' 
         WHERE id = ?`,
        [volunteerId, volunteerName, claimId]
    );

    // NOTIFIKASI: Beritahu Relawan
    const [cData] = await db.query('SELECT f.name as foodName FROM claims c JOIN food_items f ON c.food_id = f.id WHERE c.id = ?', [claimId]);
    const foodName = cData.length > 0 ? cData[0].foodName : 'makanan';
    
    await createNotification(volunteerId, 'info', 'Tugas Baru Diterima', `Anda telah ditugaskan untuk mengantar "${foodName}". Cek menu Misi Aktif!`, claimId);
    
    // NOTIFIKASI: Beritahu Penerima
    const [receiverData] = await db.query('SELECT receiver_id FROM claims WHERE id = ?', [claimId]);
    if (receiverData.length > 0) {
        await createNotification(receiverData[0].receiver_id, 'info', 'Relawan Ditemukan', `Relawan ${volunteerName} akan mengantar pesanan "${foodName}" Anda.`, claimId);
    }

    return { claimId, volunteerId, volunteerName, status: 'IN_PROGRESS' };
}

async function getAdmins() {
    const [rows] = await db.query('SELECT id, name, email, role, status, created_at, permissions FROM users WHERE role IN ("ADMIN", "SUPER_ADMIN")');
    return rows.map(u => {
        const reverseRole = Object.keys(ROLE_MAP).find(key => ROLE_MAP[key] === u.role);
        return {
            ...u,
            role: reverseRole || u.role,
            permissions: u.permissions ? (typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions) : [],
            lastLogin: 'Aktif'
        };
    });
}

async function getSystemLogs() {
    const [rows] = await db.query('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100');
    return rows;
}

async function upsertAdmin(adminData, actor) {
    const { id, name, email, password, role, status, permissions } = adminData;
    const mappedRole = mapRole(role);
    const permsJson = JSON.stringify(permissions || []);

    if (id && !String(id).startsWith('temp-')) {
        // Update
        const updates = ['name = ?', 'email = ?', 'role = ?', 'status = ?', 'permissions = ?'];
        const values = [name, email, mappedRole, status.toUpperCase(), permsJson];
        
        if (password) {
            updates.push('password = ?');
            values.push(password);
        }
        
        values.push(id);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        await logAction(actor?.id, actor?.name, 'Edit Admin', `Update data admin: ${name} (${role})`);
        return { ...adminData, id };
    } else {
        // Insert
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, status, permissions, points) VALUES (?, ?, ?, ?, ?, ?, 0)',
            [name, email, password, mappedRole, status.toUpperCase(), permsJson]
        );
        await logAction(actor?.id, actor?.name, 'Add Admin', `Tambah admin baru: ${name} (${role})`);
        return { ...adminData, id: result.insertId };
    }
}

async function deleteAdmin(id, actor) {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    await logAction(actor?.id, actor?.name, 'Delete Admin', `Hapus admin ID: ${id}`, 'critical');
    return { id, success: true };
}

async function getBroadcasts() {
    const [rows] = await db.query('SELECT * FROM broadcasts ORDER BY created_at DESC');
    return rows.map(r => ({
        ...r,
        sentAt: new Date(r.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    }));
}

async function sendBroadcast(msgData, actor) {
    const { title, content, target, type } = msgData;
    const [result] = await db.query(
        'INSERT INTO broadcasts (title, content, target, type, author_id) VALUES (?, ?, ?, ?, ?)',
        [title, content, target, type || 'info', actor?.id]
    );
    
    await logAction(actor?.id, actor?.name, 'Send Broadcast', `Kirim pengumuman: ${title} (Target: ${target})`);
    
    // Broadcast notification to active users is handled in the Hybrid Query (GET_NOTIFICATIONS)
    // because it's a "Read-on-Request" system.
    
    return { ...msgData, id: result.insertId, status: 'sent', sentAt: 'Baru saja', readCount: 0 };
}

// --- HYBRID NOTIFICATION HELPERS ---

async function createNotification(userId, type, title, message, linkedId = null) {
    if (!userId) return null;
    const [result] = await db.query(
        'INSERT INTO notifications (user_id, type, title, message, linked_id) VALUES (?, ?, ?, ?, ?)',
        [userId, type, title, message, linkedId]
    );
    return { id: result.insertId, userId, type, title, message, linkedId, isRead: false, date: new Date().toISOString() };
}

async function getUserNotifications(userId, role) {
    if (!userId) return [];

    console.log(`[NOTIF-ENGINE] Fetching for UserID: ${userId}, Role: ${role}`);

    // Normalize role for broadcast target matching
    // Front-end might send 'provider', 'volunteer', 'receiver', 'admin_manager', 'super_admin'
    // Back-end targets in DB: 'all', 'provider', 'volunteer', 'receiver', 'admin'
    let broadcastTarget = String(role || '').toLowerCase().trim();
    if (broadcastTarget === 'admin_manager' || broadcastTarget === 'super_admin' || broadcastTarget === 'admin' || broadcastTarget === 'super_admin') {
        broadcastTarget = 'admin';
    } else if (broadcastTarget === 'donatur') {
        broadcastTarget = 'provider';
    } else if (broadcastTarget === 'relawan') {
        broadcastTarget = 'volunteer';
    } else if (broadcastTarget === 'penerima') {
        broadcastTarget = 'receiver';
    }

    console.log(`[NOTIF-ENGINE] Mapped Target: ${broadcastTarget}`);

    // Unified Query: Personal + Global Broadcasts
    const query = `
        (SELECT 
            id, type, title, message, created_at, is_read, 'personal' as origin
         FROM notifications 
         WHERE user_id = ?)
        UNION ALL
        (SELECT 
            b.id, b.type, b.title, b.content as message, b.created_at, 
            IF(br.user_id IS NOT NULL, 1, 0) as is_read, 'broadcast' as origin
         FROM broadcasts b
         LEFT JOIN broadcast_reads br ON b.id = br.broadcast_id AND br.user_id = ?
         WHERE b.target = 'all' OR b.target = ?)
        ORDER BY created_at DESC
        LIMIT 50
    `;
    
    const [rows] = await db.query(query, [userId, userId, broadcastTarget]);
    return rows.map(r => ({
        id: r.origin === 'broadcast' ? `broadcast-${r.id}` : r.id,
        type: r.type,
        title: r.origin === 'broadcast' ? `[PENTING] ${r.title}` : r.title,
        message: r.message,
        date: r.created_at,
        isRead: !!r.is_read,
        priority: r.origin === 'broadcast' ? 'high' : 'medium'
    }));
}

async function markNotificationRead(userId, notifId) {
    if (!userId || !notifId) return { success: false };

    if (String(notifId).startsWith('broadcast-')) {
        const bId = notifId.replace('broadcast-', '');
        await db.query(
            'INSERT IGNORE INTO broadcast_reads (user_id, broadcast_id) VALUES (?, ?)',
            [userId, bId]
        );
    } else {
        await db.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [notifId, userId]
        );
    }
    return { success: true, notifId };
}

// --- BADGE & ACHIEVEMENT HELPERS ---

async function getBadges(role) {
    const mappedRole = role ? mapRole(role) : null;
    let query = 'SELECT * FROM badges';
    const params = [];
    
    if (mappedRole) {
        query += ' WHERE role = ? OR role IS NULL';
        params.push(mappedRole);
    }
    
    const [rows] = await db.query(query, params);
    return rows;
}

async function checkAchievements(userId, points) {
    if (!userId) return;
    
    // 1. Get all potential badges the user COULD earn
    const [user] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (user.length === 0) return;
    
    const role = user[0].role;
    const [potentialBadges] = await db.query(
        'SELECT * FROM badges WHERE (role = ? OR role IS NULL) AND min_points <= ?',
        [role, points]
    );
    
    // 2. Get badges the user ALREADY has
    const [existingBadges] = await db.query('SELECT badge_id FROM user_badges WHERE user_id = ?', [userId]);
    const existingIds = existingBadges.map(b => b.badge_id);
    
    // 3. Find new badges to award
    const newBadges = potentialBadges.filter(b => !existingIds.includes(b.id));
    
    for (const badge of newBadges) {
        await db.query('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)', [userId, badge.id]);
        
        // NOTIFIKASI: Pencapaian Baru
        await createNotification(
            userId, 
            'success', 
            'Pencapaian Baru!', 
            `Selamat! Anda baru saja membuka lencana "${badge.name}". Cek profil Anda!`,
            badge.id
        );
    }
}

// Wrap getSocialImpact to trigger achievement check
const originalGetSocialImpact = getBaseSocialImpact;
async function getSocialImpact(userId) {
    const impact = await originalGetSocialImpact(userId);
    if (impact && impact.totalPoints) {
        await checkAchievements(userId, impact.totalPoints);
    }
    return impact;
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
