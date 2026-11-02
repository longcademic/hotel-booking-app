const { v2: cloudinary } = require('cloudinary');
cloudinary.config({ secure: true });   // credentials come from CLOUDINARY_URL
module.exports = cloudinary;