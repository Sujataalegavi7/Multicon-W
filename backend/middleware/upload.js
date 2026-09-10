const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const pdfDir = path.join(__dirname, '..', 'uploads', 'pdfs');
const thumbDir = path.join(__dirname, '..', 'uploads', 'thumbnails');
[pdfDir, thumbDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// PDF Storage
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'pdf') cb(null, pdfDir);
    else cb(null, thumbDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'pdf') {
    if (ext === '.pdf' && file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only valid PDF (.pdf) documents are permitted.'), false);
    }
  } else if (file.fieldname === 'thumbnail') {
    if (ALLOWED_IMAGE_EXTS.includes(ext) && ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only safe image formats (.jpg, .jpeg, .png, .webp) are permitted for thumbnails.'), false);
    }
  } else {
    cb(new Error('Unexpected upload field.'), false);
  }
};

const maxSizeMB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '20', 10);

const upload = multer({
  storage: pdfStorage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
});

/**
 * Validates magic byte file signatures on uploaded files
 */
const validateFileSignatures = (req, res, next) => {
  if (!req.files) return next();

  const filesToCheck = [];
  if (req.files.pdf) filesToCheck.push(...req.files.pdf);
  if (req.files.thumbnail) filesToCheck.push(...req.files.thumbnail);

  for (const file of filesToCheck) {
    const filePath = file.path;
    try {
      const buffer = Buffer.alloc(12);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 12, 0);
      fs.closeSync(fd);

      let isValid = false;
      if (file.fieldname === 'pdf') {
        isValid = buffer.toString('utf8', 0, 5) === '%PDF-';
      } else if (file.fieldname === 'thumbnail') {
        const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
        const isWebp = buffer.toString('utf8', 0, 4) === 'RIFF' && buffer.toString('utf8', 8, 12) === 'WEBP';
        isValid = isJpeg || isPng || isWebp;
      }

      if (!isValid) {
        // Delete malformed/disguised file immediately
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(400).json({
          success: false,
          message: `Corrupt or disguised ${file.fieldname} file signature detected.`,
        });
      }
    } catch {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: `Failed to verify ${file.fieldname} integrity.`,
      });
    }
  }

  next();
};

module.exports = {
  upload,
  validateFileSignatures,
};

