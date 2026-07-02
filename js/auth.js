/**
 * CartGo - Authentication Module
 * Handles user signup, login, logout, password reset, and OAuth
 */

import { 
  auth, 
  database, 
  writeData, 
  updateData, 
  readData,
  logAnalyticsEvent
} from './firebase.js';

import { 
  Validator, 
  Alert, 
  Storage,
  StrUtil
} from './utils.js';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  confirmPasswordReset,
  verifyPasswordResetCode,
  sendEmailVerification,
  updateEmail
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';

/**
 * User Registration with Email and Password
 */
export const registerUser = async (email, password, confirmPassword, firstName, lastName, phone) => {
  try {
    // Validate inputs
    if (!Validator.required(email)) {
      Alert.error('Error', 'Email is required');
      return false;
    }
    if (!Validator.email(email)) {
      Alert.error('Error', 'Please enter a valid email');
      return false;
    }
    if (!Validator.password(password)) {
      Alert.error('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.error('Error', 'Passwords do not match');
      return false;
    }
    if (!Validator.required(firstName)) {
      Alert.error('Error', 'First name is required');
      return false;
    }
    if (!Validator.required(lastName)) {
      Alert.error('Error', 'Last name is required');
      return false;
    }

    Alert.loading('Creating account...');

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });

    // Send email verification
    await sendEmailVerification(user);

    // Create user document in database
    const userData = {
      uid: user.uid,
      email: email,
      firstName: firstName,
      lastName: lastName,
      phone: phone || '',
      role: 'customer',
      status: 'active',
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatar: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      },
      preferences: {
        notifications: true,
        newsletter: true,
        darkMode: false
      }
    };

    await writeData(`users/${user.uid}`, userData);

    // Store in localStorage
    Storage.set('cartgo_user_id', user.uid);
    Storage.set('cartgo_user_email', email);

    // Log analytics
    logAnalyticsEvent('user_signup', {
      email: email,
      role: 'customer'
    });

    Alert.close();
    Alert.success('Success', 'Account created! Verification email sent.');
    return true;
  } catch (error) {
    Alert.close();
    console.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      Alert.error('Error', 'Email already in use');
    } else if (error.code === 'auth/weak-password') {
      Alert.error('Error', 'Password is too weak');
    } else {
      Alert.error('Error', error.message);
    }
    return false;
  }
};

/**
 * User Login with Email and Password
 */
export const loginUser = async (email, password, rememberMe = false) => {
  try {
    // Validate inputs
    if (!Validator.required(email)) {
      Alert.error('Error', 'Email is required');
      return false;
    }
    if (!Validator.email(email)) {
      Alert.error('Error', 'Please enter a valid email');
      return false;
    }
    if (!Validator.required(password)) {
      Alert.error('Error', 'Password is required');
      return false;
    }

    Alert.loading('Logging in...');

    // Sign in user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store user info
    Storage.set('cartgo_user_id', user.uid);
    Storage.set('cartgo_user_email', email);

    if (rememberMe) {
      Storage.set('cartgo_remember_email', email);
    }

    // Log analytics
    logAnalyticsEvent('user_login', {
      email: email
    });

    Alert.close();
    Alert.success('Success', 'Logged in successfully!');
    return true;
  } catch (error) {
    Alert.close();
    console.error('Login error:', error);
    
    if (error.code === 'auth/user-not-found') {
      Alert.error('Error', 'User not found');
    } else if (error.code === 'auth/wrong-password') {
      Alert.error('Error', 'Incorrect password');
    } else if (error.code === 'auth/user-disabled') {
      Alert.error('Error', 'Account has been disabled');
    } else {
      Alert.error('Error', error.message);
    }
    return false;
  }
};

/**
 * Google Sign In
 */
export const signInWithGoogle = async () => {
  try {
    Alert.loading('Signing in with Google...');

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user exists in database
    const userExists = await readData(`users/${user.uid}`);

    if (!userExists) {
      // Create new user document
      const newUserData = {
        uid: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        phone: user.phoneNumber || '',
        role: 'customer',
        status: 'active',
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        avatar: user.photoURL || '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        preferences: {
          notifications: true,
          newsletter: true,
          darkMode: false
        },
        authProvider: 'google'
      };

      await writeData(`users/${user.uid}`, newUserData);
    } else {
      // Update last login
      await updateData(`users/${user.uid}`, {
        updatedAt: new Date().toISOString()
      });
    }

    // Store in localStorage
    Storage.set('cartgo_user_id', user.uid);
    Storage.set('cartgo_user_email', user.email);

    // Log analytics
    logAnalyticsEvent('google_signin', {
      email: user.email
    });

    Alert.close();
    Alert.success('Success', 'Signed in with Google!');
    return true;
  } catch (error) {
    Alert.close();
    console.error('Google sign-in error:', error);
    Alert.error('Error', 'Failed to sign in with Google');
    return false;
  }
};

/**
 * Facebook Sign In
 */
export const signInWithFacebook = async () => {
  try {
    Alert.loading('Signing in with Facebook...');

    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user exists in database
    const userExists = await readData(`users/${user.uid}`);

    if (!userExists) {
      // Create new user document
      const newUserData = {
        uid: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        phone: user.phoneNumber || '',
        role: 'customer',
        status: 'active',
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        avatar: user.photoURL || '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        preferences: {
          notifications: true,
          newsletter: true,
          darkMode: false
        },
        authProvider: 'facebook'
      };

      await writeData(`users/${user.uid}`, newUserData);
    } else {
      // Update last login
      await updateData(`users/${user.uid}`, {
        updatedAt: new Date().toISOString()
      });
    }

    // Store in localStorage
    Storage.set('cartgo_user_id', user.uid);
    Storage.set('cartgo_user_email', user.email);

    // Log analytics
    logAnalyticsEvent('facebook_signin', {
      email: user.email
    });

    Alert.close();
    Alert.success('Success', 'Signed in with Facebook!');
    return true;
  } catch (error) {
    Alert.close();
    console.error('Facebook sign-in error:', error);
    Alert.error('Error', 'Failed to sign in with Facebook');
    return false;
  }
};

/**
 * Forgot Password
 */
export const resetPassword = async (email) => {
  try {
    // Validate email
    if (!Validator.required(email)) {
      Alert.error('Error', 'Email is required');
      return false;
    }
    if (!Validator.email(email)) {
      Alert.error('Error', 'Please enter a valid email');
      return false;
    }

    Alert.loading('Sending reset email...');

    // Send password reset email
    await sendPasswordResetEmail(auth, email);

    Alert.close();
    Alert.success('Success', 'Password reset email sent!');

    // Log analytics
    logAnalyticsEvent('password_reset_requested', {
      email: email
    });

    return true;
  } catch (error) {
    Alert.close();
    console.error('Password reset error:', error);
    
    if (error.code === 'auth/user-not-found') {
      Alert.error('Error', 'User not found');
    } else {
      Alert.error('Error', error.message);
    }
    return false;
  }
};

/**
 * Change Password
 */
export const changePassword = async (newPassword, confirmPassword) => {
  try {
    // Validate passwords
    if (!Validator.required(newPassword)) {
      Alert.error('Error', 'Password is required');
      return false;
    }
    if (!Validator.password(newPassword)) {
      Alert.error('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.error('Error', 'Passwords do not match');
      return false;
    }

    Alert.loading('Changing password...');

    // Update password
    await auth.currentUser.updatePassword(newPassword);

    Alert.close();
    Alert.success('Success', 'Password changed successfully!');

    // Log analytics
    logAnalyticsEvent('password_changed', {
      uid: auth.currentUser.uid
    });

    return true;
  } catch (error) {
    Alert.close();
    console.error('Password change error:', error);
    
    if (error.code === 'auth/requires-recent-login') {
      Alert.error('Error', 'Please login again before changing password');
    } else {
      Alert.error('Error', error.message);
    }
    return false;
  }
};

/**
 * Send Email Verification
 */
export const sendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;

    if (!user) {
      Alert.error('Error', 'User not logged in');
      return false;
    }

    Alert.loading('Sending verification email...');

    await sendEmailVerification(user);

    Alert.close();
    Alert.success('Success', 'Verification email sent!');

    // Log analytics
    logAnalyticsEvent('email_verification_sent', {
      email: user.email
    });

    return true;
  } catch (error) {
    Alert.close();
    console.error('Verification email error:', error);
    Alert.error('Error', error.message);
    return false;
  }
};

/**
 * Check Email Verification Status
 */
export const isEmailVerified = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    // Reload user to get latest verification status
    await user.reload();
    return user.emailVerified;
  } catch (error) {
    console.error('Email verification check error:', error);
    return false;
  }
};

/**
 * Logout User
 */
export const logoutUser = async () => {
  try {
    Alert.loading('Logging out...');

    await signOut(auth);

    // Clear localStorage
    Storage.clear();

    Alert.close();

    // Log analytics
    logAnalyticsEvent('user_logout');

    return true;
  } catch (error) {
    Alert.close();
    console.error('Logout error:', error);
    Alert.error('Error', error.message);
    return false;
  }
};

/**
 * Get User Profile
 */
export const getUserProfile = async (userId) => {
  try {
    const userData = await readData(`users/${userId}`);
    return userData || null;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
};

/**
 * Update User Profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    Alert.loading('Updating profile...');

    // Update database
    updates.updatedAt = new Date().toISOString();
    await updateData(`users/${userId}`, updates);

    // Update auth profile if name is being updated
    if (updates.firstName || updates.lastName) {
      const displayName = `${updates.firstName || ''} ${updates.lastName || ''}`;
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim()
      });
    }

    Alert.close();
    Alert.success('Success', 'Profile updated successfully!');

    // Log analytics
    logAnalyticsEvent('profile_updated', {
      uid: userId
    });

    return true;
  } catch (error) {
    Alert.close();
    console.error('Update profile error:', error);
    Alert.error('Error', error.message);
    return false;
  }
};

/**
 * Delete User Account
 */
export const deleteUserAccount = async (userId) => {
  try {
    const confirmed = await Alert.confirm(
      'Delete Account',
      'This action cannot be undone. Are you sure?'
    );

    if (!confirmed.isConfirmed) {
      return false;
    }

    Alert.loading('Deleting account...');

    // Delete user data from database
    await writeData(`users/${userId}`, null);

    // Delete auth user
    await auth.currentUser.delete();

    // Clear localStorage
    Storage.clear();

    Alert.close();
    Alert.success('Success', 'Account deleted successfully!');

    // Log analytics
    logAnalyticsEvent('account_deleted', {
      uid: userId
    });

    return true;
  } catch (error) {
    Alert.close();
    console.error('Delete account error:', error);
    Alert.error('Error', error.message);
    return false;
  }
};

export default {
  registerUser,
  loginUser,
  signInWithGoogle,
  signInWithFacebook,
  resetPassword,
  changePassword,
  sendVerificationEmail,
  isEmailVerified,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount
};