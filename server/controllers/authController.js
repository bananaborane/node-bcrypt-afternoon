const bcrypt = require('bcryptjs')

module.exports = {
    register: async (req, res, next) => {
        const { username, password, isAdmin } = req.body;
        const db = req.app.get('db');
        const response = await db.get_user([username]);
        const existingUser = response[0];
        if (existingUser) {
          return res.status(409).send('username taken');
        }
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        const registeredUser = await db.register_user([isAdmin, username, hash]);
        const user = registeredUser[0];
        req.session.user = { isAdmin: user.is_admin, username: user.username, id: user.id };
        return res.status(201).send(req.session.user);
      },    
    login: async (req, res, next)=>{
        let { username, password } = req.body;
        let db = req.app.get('db');
        let foundUser = await db.get_user([username]);
        const user = foundUser[0];
        if (!user){
            return res.status(401).send('user not found. please register as a new user before logging in') 
        }
        const isAuthenticated = bcrypt.compareSync(password, user.hash);
        if (!isAuthenticated){
            return res.status(403).send('incorrect password, try again')
        }
        req.session.user = { 
            isAdmin: user.is_admin, 
            id: user.id, 
            username: user.username };
        return res.status(200).send(req.session.user)
    },
    logout: async (req, res, next)=>{
        req.session.destroy();
        res.status(200).send('logged out')
    }
}