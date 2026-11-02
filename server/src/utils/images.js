const cloudinary = require('../config/cloudinary');

const FOLDER = 'hotel-booking';

exports.uploadBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: FOLDER, resource_type: 'image', transformation: [{ width: 1600, height: 1600, crop: 'limit' }] },
        (err, result) => (err ? reject(err) : resolve(result))
      )
      .end(buffer);
  });

// Only Cloudinary URLs map to a public id; seed placeholders (picsum) are ignored
const publicIdFromUrl = (url) => {
  const m = String(url).match(/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return m ? m[1] : null;
};

exports.deleteImages = async (urls = []) => {
  const ids = urls.map(publicIdFromUrl).filter(Boolean);
  await Promise.all(ids.map((id) => cloudinary.uploader.destroy(id)));
};