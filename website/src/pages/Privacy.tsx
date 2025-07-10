import React from "react";

const Privacy: React.FC = () => (
  <div className="container mx-auto px-4 py-8 max-w-2xl">
    <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
    <p className="mb-4">This Privacy Policy explains how Level0's TikTok Integration ("the App") collects and uses your information. This app is intended for private use only.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">1. Information Collected</h2>
    <p className="mb-4">The app collects only the information necessary to post videos to your TikTok account, including your TikTok access token and related data.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">2. Use of Information</h2>
    <p className="mb-4">Your information is used solely to authenticate and post content to your TikTok account with your permission.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Security</h2>
    <p className="mb-4">Your data is stored securely and is not shared with any third parties.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">4. No Data Sharing</h2>
    <p className="mb-4">Since this app is for private use, no user data is shared or sold.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">5. Your Control</h2>
    <p className="mb-4">You can revoke the app’s access to your TikTok account at any time through TikTok’s account settings.</p>
    <h2 className="text-xl font-semibold mt-6 mb-2">6. Policy Updates</h2>
    <p className="mb-4">This policy may be updated occasionally. Continued use of the app indicates acceptance of any changes.</p>
    <p>If you have any questions about your data, please contact the developer.</p>
  </div>
);

export default Privacy; 