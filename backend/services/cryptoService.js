const crypto = require("crypto");

const AES_ALGORITHM = "aes-256-gcm";
const AES_KEY_LENGTH = 32;
const IV_LENGTH = 12;

function ensureBuffer(value, name) {
	if (!Buffer.isBuffer(value) || value.length === 0) {
		throw new Error(`${name} must be a non-empty Buffer`);
	}
}

function decodeBase64(value, name) {
	if (!value || typeof value !== "string") {
		throw new Error(`${name} is required`);
	}

	try {
		const decoded = Buffer.from(value, "base64");
		if (!decoded.length) {
			throw new Error("Empty decoded value");
		}
		return decoded;
	} catch (error) {
		throw new Error(`${name} must be valid base64`);
	}
}

function generateKeyPair() {
	const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: {
			type: "spki",
			format: "pem",
		},
		privateKeyEncoding: {
			type: "pkcs8",
			format: "pem",
		},
	});

	return { publicKey, privateKey };
}

function encryptFile(fileBuffer, publicKey, options = {}) {
	ensureBuffer(fileBuffer, "fileBuffer");

	if (!publicKey || typeof publicKey !== "string") {
		throw new Error("publicKey is required");
	}

	const sessionKey = crypto.randomBytes(AES_KEY_LENGTH);
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(AES_ALGORITHM, sessionKey, iv);

	const ciphertext = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
	const tag = cipher.getAuthTag();

	const encryptedKey = crypto.publicEncrypt(
		{
			key: publicKey,
			padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
			oaepHash: "sha256",
		},
		sessionKey
	);

	return {
		version: 1,
		algorithm: {
			asymmetric: "RSA-OAEP-SHA256",
			symmetric: "AES-256-GCM",
		},
		encrypted_key: encryptedKey.toString("base64"),
		iv: iv.toString("base64"),
		ciphertext: ciphertext.toString("base64"),
		tag: tag.toString("base64"),
		original_name: options.originalName || "file.bin",
		mime_type: options.mimeType || "application/octet-stream",
	};
}

function decryptFile(payload, privateKey) {
	if (!payload || typeof payload !== "object") {
		throw new Error("payload is required");
	}

	if (!privateKey || typeof privateKey !== "string") {
		throw new Error("privateKey is required");
	}

	const encryptedKey = decodeBase64(payload.encrypted_key, "encrypted_key");
	const iv = decodeBase64(payload.iv, "iv");
	const ciphertext = decodeBase64(payload.ciphertext, "ciphertext");
	const tag = decodeBase64(payload.tag, "tag");

	if (iv.length !== IV_LENGTH) {
		throw new Error("iv must be 12 bytes for AES-GCM");
	}

	let sessionKey;
	try {
		sessionKey = crypto.privateDecrypt(
			{
				key: privateKey,
				padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
				oaepHash: "sha256",
			},
			encryptedKey
		);
	} catch (error) {
		throw new Error("Failed to decrypt session key");
	}

	if (sessionKey.length !== AES_KEY_LENGTH) {
		throw new Error("Invalid session key length");
	}

	try {
		const decipher = crypto.createDecipheriv(AES_ALGORITHM, sessionKey, iv);
		decipher.setAuthTag(tag);
		const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

		return {
			fileBuffer: plaintext,
			fileName: payload.original_name || "decrypted_file",
			mimeType: payload.mime_type || "application/octet-stream",
		};
	} catch (error) {
		throw new Error("Failed to decrypt payload or verify integrity");
	}
}

module.exports = {
	generateKeyPair,
	encryptFile,
	decryptFile,
};
