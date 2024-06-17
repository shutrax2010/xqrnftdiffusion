const isAuthenticated = (req, res, next) => {
    // Example: Check if user is authenticated 
    if (req.session && req.session.authenticated && req.session.resolved) {
      return next(); // User is authenticated, proceed to next middleware or route handler
    } else {
      return res.redirect('/'); // Redirect to index or login page if not authenticated
    }
  };
  
  module.exports = { isAuthenticated };