const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

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
            case 'GET_NOTIFICATIONS': result = await getAllData('notifications'); break;
            case 'SEND_BROADCAST': result = await sendBroadcast(data); break;
            
            case 'GET_SETTINGS': result = appSettings; break;
            case 'UPDATE_SETTINGS': 
                appSettings = { ...appSettings, ...data };
                result = appSettings; 
                break;

            case 'GET_SOCIAL_IMPACT': result = await getSocialImpact(data.userId); break;
            case 'GET_IMPACT_CHART': result = await getImpactChart(data.userId, data.period); break;
            
            case 'GET_FOOD_REQUESTS': result = await getFoodRequests(data.receiverId); break;
            case 'ADD_FOOD_REQUEST': result = await addFoodRequest(data); break;
            case 'DELETE_FOOD_REQUEST': result = await deleteData('food_requests', data.id); break;

            case 'GET_POINT_HISTORY': result = await getPointHistory(data.userId); break;
            case 'GET_BADGES': result = await getAllData('badges'); break;

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
        res.status(500).json({ status: 'error', message: error.message });
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

// --- IMPLEMENTATIONS ---

async function registerUser(data) {
    const { name, email, password, role, phone, avatar } = data;
    // Check if email exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) throw new Error('Email ini sudah terdaftar.');

    const [result] = await db.query(
        'INSERT INTO users (name, email, password, role, phone, avatar, points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, password, mapRole(role), phone, avatar, 0, 'ACTIVE']
    );
    return { id: result.insertId, ...data, isNewUser: true, status: 'ACTIVE', points: 0 };
}

async function loginUser(data) {
    const { email, password } = data;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) throw new Error('Email atau Password salah.');
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
    const { providerId, name, description, initialQuantity, currentQuantity, expiryTime, imageUrl, deliveryMethod } = data;
    const [result] = await db.query(
        'INSERT INTO food_items (provider_id, name, description, initial_quantity, current_quantity, max_quantity, expiry_time, distribution_start_time, distribution_end_time, delivery_method, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [providerId, name, description, initialQuantity, currentQuantity, initialQuantity, expiryTime, '08:00:00', '20:00:00', deliveryMethod.toUpperCase(), imageUrl]
    );
    return { id: result.insertId, ...data };
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

        await connection.commit();
        return { success: true, newStock, claimId: claimResult.insertId };
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
    return { id, status: dbStatus };
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

async function getSocialImpact(userId) {
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
