const express=require('express');
const router= express.Router();
const User=require('../models/users');
const multer =require('multer');
const fs =require("fs").promises;

//image upload
var storage =multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./uploads")
    },
    filename:function(req, file,cb){
        cb(null, file.fieldname +"_"+ Date.now()+"_"+file.originalname);
    },
});

var upload=multer({
    storage:storage,
}).single("image");

//Inserting user into database route
router.post('/add', upload, (req, res)=>{
    const user =new User({
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        image:req.file.filename,
    }   
    );

    // New code which accepts a callback function starts
    user.save().then(()=>{
        req.session.message ={
            type: 'success',
            message: 'user added succesfully!'
        };
        res.redirect('/');
    }).catch((err)=>{
        res.json({message: err.message, type:'danger'});
    });

})
// New code which accepts a callback function ends

//Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.render('index', {
            title: 'Home Page',
            users
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/add',(req, res)=>{
    res.render('add_users', {title:"Add Users"})
})

//Edit an user route
router.get('/edit/:id', async (req, res) => {
    try {
        // Find the user by ID
        const user = await User.findById(req.params.id);

        // Check if user exists
        if (!user) {
            return res.redirect('/'); // Redirect to home page if user not found
        }

        // Render the edit user page
        res.render('edit_users', {
            title: 'Edit User',
            user
        });
    } catch (err) {
        // Handle errors
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
  
  router.post('/update/:id', upload, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;
  
    let newImage = req.body.old_image; // Default to existing image
  
    try {
      if (req.file) { // If a new image file was uploaded
        newImage = req.file.filename;
  
        // Delete the old image (optional, handle errors gracefully)
        try {
          await fs.unlink('./uploads/' + req.body.old_image);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
  
      // Update the user using findByIdAndUpdate (async/await syntax)
      const updatedUser = await User.findByIdAndUpdate(id, {
        name,
        email,
        phone,
        image: newImage,
      }, { new: true }); // Return the updated user document
  
      if (!updatedUser) {
        return res.json({ message: 'User not found!', type: 'danger' });
      }
      req.session.message ={
        type: 'success',
        message: 'User updated succesfully!'
    };
    res.redirect('/');

    } catch (error) {
      console.error('Error updating user:', error);
      res.json({ message: error.message, type: 'danger' });
    }
  });
  

  // Delete user route
  router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedUser = await User.findByIdAndDelete(id);
  
      if (!deletedUser) {
        return res.json({ message: 'User not found!', type: 'danger' });
      }
  
      if (deletedUser.image) { // Check if image property exists before deletion
        try {
          await fs.promises.unlink('./uploads/' + deletedUser.image);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }
  
      req.session.message = { type: 'info', message: 'User deleted successfully' };
      res.redirect('/');
    } catch (error) {
      console.error('Error deleting user:', error);
      res.json({ message: error.message, type: 'danger' });
    }
  });

module.exports=router;