import { AccessControl } from "accesscontrol";

const accessControl = new AccessControl();

// Main role
accessControl.grant('reader').readAny('post').createAny('follow').updateOwn('user');

// User
accessControl.grant('writer').extend('reader').createOwn('post').deleteOwn('post');

// Admin
accessControl.grant('admin').readAny('post').deleteAny('post').deleteAny('user').updateAny('user');
accessControl.deny('admin').createAny('follow');


export default accessControl;