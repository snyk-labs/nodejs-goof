// @TODO use this adminService file once Snyk Code for VSCode
// is able to navigate to cross-file paths in the vuln description 
/** 
module.exports.adminLoginSuccess = function(redirectPage, res) {
    console.log({redirectPage})
    if (redirectPage) {
        return res.redirect(redirectPage)
    } else {
        return res.redirect('/admin')
    }
}
*/
// deepcode ignore HardcodedNonCryptoSecret: <please specify a reason of ignoring this>
var token = 'SECRET_TOKEN_f8ed84e8f41e4146403dd4a6bbcea5e418d23a9';