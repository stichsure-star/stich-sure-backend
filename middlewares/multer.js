const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1]
        const fileName = `IMG-${Date.now()}_${Math.floor(Math.random() * 1E10)}.${ext}`
        cb(null, fileName)
    }
});

const fileFilter = (req, file, cb)=> {
    console.log('File: ',file);
    console.log('File Mimetype: ', file.mimetype);
    
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else{
        cb(new Error('Invalid image format, only images allowed'))
    }
}

const limits = {
    fileSize: 1024 * 1024 * 5
}

const upload =multer({
    storage,
    fileFilter,
    limits
})

module.exports = upload;