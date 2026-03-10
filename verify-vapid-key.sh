#!/bin/bash
# Firebase VAPID Key Verification Script

echo "🔐 Firebase VAPID Key Configuration"
echo "===================================="
echo ""
echo "Current VAPID Key in your code:"
echo "BBLh53iniDnUyBJ89lGFK86Jc_9lRnUEzhTNj-wY6yFEVZqWbTM8rf2hIB-QOECmQQqS6XCp2yUVcEROv7TLz9U"
echo ""
echo "To verify this is correct:"
echo "1. Go to: https://console.firebase.google.com"
echo "2. Select project: 'recital-notification'"
echo "3. Navigate to: Project Settings → Cloud Messaging tab"
echo "4. Look for: 'Web API Key' and 'Server key'"
echo "5. The VAPID key should be visible there"
echo ""
echo "If the VAPID key doesn't match:"
echo "1. Copy the correct VAPID key from Firebase Console"
echo "2. Update src/firebase.js line 46"
echo "3. Reload the app"

