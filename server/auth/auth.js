import passport from 'passport';
import passportClientCert from 'passport-client-cert';

const ClientCertStrategy = passportClientCert.Strategy;

passport.use(new ClientCertStrategy((cert, done) => {
    if (!cert || !cert.subject || !cert.subject.CN) {
        return done(null, false);
    }
    return done(null, true);
}
));

export default passport;