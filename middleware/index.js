// Middleware: only authenticated users can access protected routes
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'You must be logged in to access that page.');
    res.redirect('/login');
}

// Middleware: only Admin users
function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'Admin') return next();
    req.flash('error', 'Admin access required.');
    res.redirect('/dashboard');
}

// Middleware: Organizer or Admin (can create events)
function isOrganizerOrAdmin(req, res, next) {
    if (req.isAuthenticated() && (req.user.role === 'Organizer' || req.user.role === 'Admin')) return next();
    req.flash('error', 'Only Organizers and Admins can perform this action.');
    res.redirect('/events');
}

module.exports = { isLoggedIn, isAdmin, isOrganizerOrAdmin };
