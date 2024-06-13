const isAuthenticated = (req, res, next) => {
    // Example: Check if user is authenticated (you can replace this with your actual authentication logic)
    if (req.session && req.session.authenticated) {
      return next(); // User is authenticated, proceed to next middleware or route handler
    } else {
      return res.redirect('/'); // Redirect to index or login page if not authenticated
    }
  };
  
  module.exports = { isAuthenticated };