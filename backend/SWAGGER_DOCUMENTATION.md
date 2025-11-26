# 📚 Swagger API Documentation Setup - Complete!

## 🎉 What's Been Installed

You now have **beautiful, interactive API documentation** powered by **DRF Spectacular** (Swagger/OpenAPI 3.0)!

---

## 🌐 Access Your API Documentation

### **Swagger UI** (Interactive, Try-It-Out Interface)
```
http://localhost:8000/api/docs/
```
**Features:**
- ✅ Interactive API testing
- ✅ Try endpoints directly in browser
- ✅ JWT authentication support (click "Authorize" button)
- ✅ Request/response examples
- ✅ Organized by tags (Authentication, Wallet, Transactions, etc.)
- ✅ Filter and search endpoints

### **ReDoc** (Beautiful Documentation)
```
http://localhost:8000/api/redoc/
```
**Features:**
- ✅ Clean, professional documentation
- ✅ Three-panel layout
- ✅ Download as PDF/HTML
- ✅ Great for sharing with frontend team

### **OpenAPI Schema** (JSON/YAML)
```
http://localhost:8000/api/schema/
```
**Features:**
- ✅ Download raw OpenAPI 3.0 schema
- ✅ Import into Postman, Insomnia, etc.
- ✅ Generate client SDKs

---

## 🎨 Customizations Applied

### **1. Comprehensive Description**
The documentation includes:
- Welcome message
- Feature overview
- Getting started guide
- Authentication instructions
- API response format
- Demo mode notes

### **2. Organized Tags**
All endpoints are grouped into categories:
- 🔐 **Authentication** - Signup, login, session management
- 👤 **User Profile** - Profile management
- 🖼️ **Face Verification** - AI-powered identity verification
- 💰 **Wallet** - Balance and account info
- 💳 **Transactions** - Send money, history
- 📊 **Bill Payments** - Airtime, data, utilities
- 🔒 **Security** - Transaction PIN
- 👥 **Beneficiaries** - Saved recipients
- 📈 **Analytics** - Insights and reports
- 🤖 **AI Support** - Customer service chatbot
- 📱 **Dashboard** - Summary data

### **3. Enhanced Swagger UI**
Custom settings applied:
- **Deep linking** enabled
- **Persistent authorization** (JWT token stays after refresh)
- **Try it out** enabled by default
- **Monokai syntax highlighting** theme
- **Filtering** by endpoint name
- **Alphabetically sorted** tags and operations

### **4. JWT Authentication**
Pre-configured Bearer authentication:
1. Click **"Authorize"** button in Swagger UI
2. Enter: `Bearer <your_access_token>`
3. All protected endpoints will automatically use your token

---

## 📖 Documented Endpoints

### **Wallet Endpoints** (With Schema)
- ✅ `GET /api/wallet/wallet/balance/` - Get wallet balance
- ✅ `POST /api/wallet/transactions/send/` - Send money (with examples)
- ✅ `GET /api/wallet/analytics/` - Get analytics (with query params)
- ✅ `POST /api/wallet/support/chat/` - AI chat (with examples)
- ✅ `GET /api/wallet/dashboard/` - Dashboard summary

### **Other Endpoints**
All other endpoints are also available in Swagger, though some may need manual schema annotations for better documentation (optional enhancement).

---

## 🚀 How to Use Swagger UI

### **Step 1: Start the Server**
```bash
cd backend
uv run python manage.py runserver
```

### **Step 2: Open Swagger UI**
Navigate to: `http://localhost:8000/api/docs/`

### **Step 3: Authenticate**
1. Create an account or login via Swagger
2. Copy the `access` token from the response
3. Click **"Authorize"** button (top-right)
4. Enter: `Bearer <paste_token_here>`
5. Click **"Authorize"** then **"Close"**

### **Step 4: Test Endpoints**
1. Click on any endpoint to expand
2. Click **"Try it out"**
3. Fill in the request body/parameters
4. Click **"Execute"**
5. View the response below

---

## 💡 Usage Examples

### **Example 1: Complete Signup Flow**

1. **Request OTP**
   - Endpoint: `POST /api/auth/signup/request-otp/`
   - Body:
     ```json
     {
       "phone_number": "+1234567890"
     }
     ```

2. **Verify OTP & Create Account**
   - Endpoint: `POST /api/auth/signup/verify-otp/`
   - Body:
     ```json
     {
       "phone_number": "+1234567890",
       "otp_code": "1234",
       "password": "123456",
       "full_name": "Test User",
       "device_id": "test_device_123"
     }
     ```

3. **Copy Access Token**
   - From response: `data.tokens.access`

4. **Authorize**
   - Click "Authorize" button
   - Enter: `Bearer <token>`

5. **Test Protected Endpoints**
   - Try: `GET /api/wallet/wallet/balance/`
   - Try: `GET /api/wallet/dashboard/`

---

## 🎯 Key Features

### **1. Request Examples**
Many endpoints include pre-filled examples:
- Send money by phone
- Send money by account
- Start AI chat
- Continue AI conversation

### **2. Response Schemas**
All responses show:
- HTTP status codes
- Response structure
- Field types and descriptions

### **3. Query Parameters**
Documented with:
- Parameter name
- Type (int, string, etc.)
- Required/Optional
- Default value
- Description

### **4. Validation Errors**
Try invalid data to see error responses:
- Missing required fields
- Invalid formats
- Business logic errors

---

## 📱 For Frontend Developers

### **Export OpenAPI Schema**
Download schema for code generation:
```bash
# Download YAML
curl http://localhost:8000/api/schema/ > openapi.yaml

# Or use browser
http://localhost:8000/api/schema/
```

### **Import to Postman**
1. Open Postman
2. Import → Link
3. Enter: `http://localhost:8000/api/schema/`
4. All endpoints imported!

### **Import to Insomnia**
1. Create → Import from URL
2. Enter: `http://localhost:8000/api/schema/`

### **Generate Client SDK**
Use OpenAPI Generator:
```bash
# Install
npm install @openapitools/openapi-generator-cli -g

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:8000/api/schema/ \
  -g typescript-angular \
  -o ./src/app/api-client
```

---

## 🔧 Configuration Files

### **Settings Applied** ([core/settings.py](core/settings.py))
```python
# Added to INSTALLED_APPS
'drf_spectacular',

# Added to REST_FRAMEWORK
'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',

# SPECTACULAR_SETTINGS configured with:
- Title, description, version
- Custom tags
- Swagger UI settings
- JWT authentication
- Server URLs
```

### **URLs Configured** ([core/urls.py](core/urls.py))
```python
path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
```

---

## 🎨 Customization Options

### **Change Theme Color**
Edit `settings.py` → `SPECTACULAR_SETTINGS`:
```python
'SWAGGER_UI_SETTINGS': {
    'syntaxHighlight.theme': 'monokai',  # Try: agate, nord, tomorrow-night
}
```

### **Add More Examples**
In your views, add `@extend_schema`:
```python
@extend_schema(
    examples=[
        OpenApiExample(
            'Example Name',
            value={"key": "value"}
        )
    ]
)
```

### **Change Default Expand**
```python
'SWAGGER_UI_SETTINGS': {
    'docExpansion': 'none',  # Options: 'list', 'full', 'none'
}
```

---

## 📊 Current Status

✅ **Installed:** drf-spectacular
✅ **Configured:** Settings and URLs
✅ **Tagged:** 11 endpoint categories
✅ **Documented:** Key wallet endpoints with examples
✅ **Authentication:** JWT Bearer configured
✅ **Themes:** Monokai syntax highlighting
✅ **Server:** Running at localhost:8000

---

## 🚦 Next Steps (Optional Enhancements)

### **1. Add More Schema Decorators**
Add `@extend_schema` to remaining auth endpoints in `authApi/views.py`:
```python
from drf_spectacular.utils import extend_schema

@extend_schema(
    tags=['Authentication'],
    summary='Login User',
    description='Authenticate user and get JWT tokens',
    ...
)
class LoginView(APIView):
    ...
```

### **2. Add Request/Response Examples**
More examples = better documentation:
```python
examples=[
    OpenApiExample('Success Case', value={...}),
    OpenApiExample('Error Case', value={...})
]
```

### **3. Custom Swagger Logo**
Add your logo to Swagger UI (requires custom template).

### **4. API Versioning**
If you add API versions, update schema configuration.

---

## 🐛 Troubleshooting

### **Schema Generation Warnings**
Some warnings are normal for APIView classes. To fix:
- Add `@extend_schema` decorators
- Or inherit from `GenericAPIView`

### **Server Won't Start**
```bash
# Make sure all dependencies are installed
cd backend
uv sync
uv run python manage.py runserver
```

### **Swagger UI Not Loading**
- Check server is running
- Clear browser cache
- Try ReDoc instead: `/api/redoc/`

---

## 🎉 Success!

Your API documentation is live and beautiful!

**Access it now:**
- **Swagger UI:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/
- **Schema:** http://localhost:8000/api/schema/

**Perfect for:**
- ✅ Testing APIs during development
- ✅ Sharing with frontend team
- ✅ Client SDK generation
- ✅ API documentation for stakeholders

---

**Happy documenting! 📚**
