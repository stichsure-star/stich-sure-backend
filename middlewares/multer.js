const multer = require('multer');

exports.upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) =>{
            cb(null, './assets')
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
        }
    }), 
    limits: {
        filesize: 1024 * 1024 * 40
    },
    fileFilter: (req, file, cb) => {
        if(!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed!'))
        }else{
            cb(null, true)
        }
    }
})