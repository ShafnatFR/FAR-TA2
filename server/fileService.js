const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');
const PHOTO_PROFIL_DIR = path.join(ASSETS_DIR, 'fotoProfil');

// Ensure directories exist
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR);
}
if (!fs.existsSync(PHOTO_PROFIL_DIR)) {
    fs.mkdirSync(PHOTO_PROFIL_DIR);
}

const sharp = require('sharp');

/**
 * Save Base64 image to local storage with auto-compression
 * @param {string} base64Data 
 * @param {string} filename 
 * @param {string} targetFolder - Optional subfolder name
 */
async function uploadToFileSystem(base64Data, filename, targetFolder = 'fotoProfil') {
    try {
        // Prevent Path Traversal
        const safeFolder = path.basename(targetFolder);
        const safeFilename = path.basename(filename);
        
        const uploadDir = path.join(ASSETS_DIR, safeFolder);
        
        // Ensure the target subfolder exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const base64Parts = base64Data.split(',');
        const mimeType = (base64Parts[0].match(/:(.*?);/)?.[1]) || 'image/jpeg';
        const base64Content = base64Parts[1] || base64Data;
        const buffer = Buffer.from(base64Content, 'base64');
        const filePath = path.join(uploadDir, safeFilename);
        
        // Double check it's within ASSETS_DIR
        const resolvedPath = path.resolve(filePath);
        const resolvedAssetsPath = path.resolve(ASSETS_DIR);
        if (!resolvedPath.startsWith(resolvedAssetsPath)) {
            throw new Error('Path traversal detected');
        }
        
        if (mimeType.startsWith('image/')) {
            // Sharp processing: Resize to max 1200x1200px and compress to JPEG (quality 80)
            await sharp(buffer)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toFile(filePath);

            let stats = fs.statSync(filePath);
            if (stats.size > 2 * 1024 * 1024) {
                const tempPath = filePath + '.tmp';
                await sharp(filePath).jpeg({ quality: 60 }).toFile(tempPath);
                fs.renameSync(tempPath, filePath);
            }
        } else {
            // For videos and other binary files, save directly
            fs.writeFileSync(filePath, buffer);
            console.log(`[FILE] Binary file saved directly: ${safeFilename} (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
        }

        return `/assets/${safeFolder}/${safeFilename}`;
    } catch (error) {
        console.error('File Upload Error:', error);
        throw error;
    }
}

/**
 * Delete a file by its URL
 */
async function deleteFile(fileUrl) {
    if (!fileUrl) return;
    
    // Prevent SSRF by extracting path manually instead of relying on URL constructor
    let relativePath = fileUrl;
    if (fileUrl.startsWith('http')) {
        const match = fileUrl.match(/^https?:\/\/[^\/]+(\/.*)$/);
        if (match && match[1]) {
            relativePath = match[1];
        } else {
            return; // Invalid URL structure
        }
    }

    if (!relativePath.startsWith('/assets/')) return;
    
    try {
        // Strip out only the prefix, and forbid directory climbing
        const cleanPath = relativePath.slice('/assets/'.length); 
        if (cleanPath.includes('..')) {
            console.warn(`[FILE] Path traversal attempt in deleteFile: ${cleanPath}`);
            return;
        }

        const filePath = path.join(ASSETS_DIR, cleanPath);
        
        // Secondary bounds check
        const resolvedPath = path.resolve(filePath);
        const resolvedAssetsPath = path.resolve(ASSETS_DIR);
        if (!resolvedPath.startsWith(resolvedAssetsPath)) {
            console.warn(`[FILE] Deletion resolved outside ASSETS_DIR: ${resolvedPath}`);
            return;
        }

        if (fs.existsSync(resolvedPath)) {
            fs.unlinkSync(resolvedPath);
            console.log(`[FILE] Deleted old asset: ${resolvedPath}`);
        }
    } catch (error) {
        console.error(`[FILE] Failed to delete old asset: ${fileUrl}`, error);
    }
}

module.exports = { uploadToFileSystem, deleteFile };
