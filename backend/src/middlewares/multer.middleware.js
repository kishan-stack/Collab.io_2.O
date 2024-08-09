import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
         const uniqueSuffix = crypto.randomBytes(16).toString("hex");
        
        // Extract the file extension
        const ext = path.extname(file.originalname);
        
        // Construct the new filename
        const newFilename = `${uniqueSuffix}${ext}`;
        cb(null, newFilename);
    },
});

export const upload = multer({ 
    storage,
}); 