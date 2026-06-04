# Stitch Sure Backend System Architecture

## 1. Introduction

Stitch Sure is a tailoring and fashion service platform that connects customers with designers. Customers can browse ready-made designs, request custom clothing, upload reference images, provide measurements, and track the progress of their requests. Designers can manage their profiles, upload design samples, receive customer requests, and update request status as work progresses.

The backend should be designed as a modular Express.js application using Sequelize as the ORM and MySQL as the relational database. The best architecture for this stage of the project is a modular monolith. This means the application is deployed as one backend service, but the code is organized into clear modules such as authentication, customers, designers, designs, requests, uploads, orders, and notifications.

This approach keeps the system simple enough to build and maintain while still making it easy to scale or split into services later if the application grows.

## 2. Architecture Goals

The main goals of the backend architecture are:

- Provide secure authentication for customers and designers.
- Separate customer and designer responsibilities clearly.
- Support design catalog management.
- Support custom clothing requests with uploaded reference images.
- Track request and order progress from creation to completion.
- Store relational data consistently using MySQL.
- Keep the codebase easy to understand, test, and extend.
- Allow future integration with payments, notifications, and cloud file storage.

## 3. High-Level System Architecture

```text
Client Application
Web App / Mobile App
        |
        v
REST API Layer
Express.js Server
        |
        +-- Authentication Module
        +-- Customer Module
        +-- Designer Module
        +-- Design Module
        +-- Request Module
        +-- Upload Module
        +-- Order Module
        +-- Payment Module
        +-- Notification Module
        |
        v
Service Layer
Business Logic
        |
        v
Data Access Layer
Sequelize ORM
        |
        v
MySQL Database
```

The client application communicates with the backend through REST API endpoints. The Express server receives the request, applies middleware such as authentication and validation, then passes the request to the appropriate controller. Controllers call service functions where business logic is handled. Sequelize models are then used to read from or write to the MySQL database.

## 4. Recommended Backend Structure

```text
src/
  config/
    database.js
    cloudinary.js

  models/
    customer.js
    designer.js
    designs.js
    designimage.js
    request.js
    requestimage.js
    order.js
    payment.js
    notification.js
    measurement.js
    review.js

  migrations/

  controllers/
    auth.controller.js
    customer.controller.js
    designer.controller.js
    design.controller.js
    request.controller.js
    order.controller.js
    upload.controller.js
    payment.controller.js

  services/
    auth.service.js
    customer.service.js
    designer.service.js
    design.service.js
    request.service.js
    order.service.js
    upload.service.js
    payment.service.js
    email.service.js
    notification.service.js

  routes/
    auth.routes.js
    customer.routes.js
    designer.routes.js
    design.routes.js
    request.routes.js
    order.routes.js
    upload.routes.js
    payment.routes.js

  middlewares/
    auth.middleware.js
    role.middleware.js
    error.middleware.js
    upload.middleware.js
    validate.middleware.js

  validators/
    auth.validator.js
    customer.validator.js
    designer.validator.js
    design.validator.js
    request.validator.js
    order.validator.js

  utils/
    generateOtp.js
    jwt.js
    response.js
    pagination.js

  app.js
  server.js
```

The current project already has several of these folders, such as `models`, `migrations`, `controller`, `routes`, `middlewares`, and `utils`. The architecture can be introduced gradually without rewriting the whole project at once.

## 5. Core Modules

### 5.1 Authentication Module

The authentication module handles account creation, login, email verification, password reset, and token generation.

Responsibilities:

- Register customers.
- Register designers.
- Login users.
- Generate JWT access tokens.
- Hash passwords before saving them.
- Send and verify OTP codes.
- Protect private API routes.
- Support role-based access for customers and designers.

Recommended endpoints:

```text
POST /api/auth/customer/register
POST /api/auth/designer/register
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 5.2 Customer Module

The customer module manages customer profiles and customer-related actions.

Responsibilities:

- View and update customer profile.
- Upload profile photo.
- Create custom clothing requests.
- View request history.
- View order history.
- Save body measurements.
- Review completed designer work.

Recommended endpoints:

```text
GET    /api/customers/profile
PATCH  /api/customers/profile
GET    /api/customers/requests
GET    /api/customers/orders
POST   /api/customers/measurements
PATCH  /api/customers/measurements/:id
```

### 5.3 Designer Module

The designer module manages designers and their work.

Responsibilities:

- View and update designer profile.
- Upload profile photo or portfolio images.
- Create and manage designs.
- View incoming customer requests.
- Accept or reject requests.
- Update work progress.
- View designer earnings and completed orders.

Recommended endpoints:

```text
GET    /api/designers/profile
PATCH  /api/designers/profile
GET    /api/designers/requests
PATCH  /api/designers/requests/:id/status
GET    /api/designers/designs
```

### 5.4 Design Module

The design module manages the design catalog. Designers can upload designs, and customers can browse them.

Responsibilities:

- Create designs.
- Upload design images.
- List available designs.
- Filter designs by category, price, or designer.
- Update design details.
- Delete designs.

Recommended endpoints:

```text
POST   /api/designs
GET    /api/designs
GET    /api/designs/:id
PATCH  /api/designs/:id
DELETE /api/designs/:id
POST   /api/designs/:id/images
```

### 5.5 Request Module

The request module is one of the most important parts of the system. It allows customers to create custom clothing requests and attach reference images.

Responsibilities:

- Create a custom request.
- Attach request images.
- Store deadline, description, measurements, and preferred designer.
- Allow designers to accept or reject requests.
- Track request status.
- Allow customers and designers to view request details.

Recommended request statuses:

```text
pending
accepted
in_progress
ready_for_delivery
delivered
completed
cancelled
rejected
```

Recommended endpoints:

```text
POST   /api/requests
GET    /api/requests
GET    /api/requests/:id
PATCH  /api/requests/:id
PATCH  /api/requests/:id/status
POST   /api/requests/:id/images
DELETE /api/requests/:id/images/:imageId
```

### 5.6 Upload Module

The upload module handles file uploads for profile photos, design images, and request reference images.

Responsibilities:

- Validate uploaded file type.
- Validate file size.
- Upload files to Cloudinary, AWS S3, or another storage provider.
- Store only the image URL and public ID in the database.
- Delete old images when replaced.

The backend should avoid storing uploaded images directly in the database. Images should be stored in cloud storage, while the database stores image metadata.

### 5.7 Order Module

The order module should be introduced when the platform starts handling actual transactions or confirmed jobs.

Responsibilities:

- Create an order from a design purchase.
- Create an order from an accepted custom request.
- Track order status.
- Connect orders to customers and designers.
- Store delivery or pickup information.

Recommended order statuses:

```text
pending_payment
paid
in_progress
ready
delivered
completed
cancelled
refunded
```

### 5.8 Payment Module

The payment module handles online payments and payment status.

Responsibilities:

- Initialize payment.
- Verify payment.
- Store payment reference.
- Update order payment status.
- Support refunds if needed.

Possible providers:

- Paystack
- Flutterwave
- Stripe

For a Nigerian market, Paystack or Flutterwave would be a strong first choice.

### 5.9 Notification Module

The notification module keeps users informed about important events.

Responsibilities:

- Send email verification messages.
- Send password reset OTPs.
- Notify designers about new requests.
- Notify customers when a request is accepted or completed.
- Store in-app notifications.

Notification examples:

```text
New request submitted
Designer accepted your request
Request status changed to in_progress
Order is ready for delivery
Payment confirmed
```

## 6. Database Design

### 6.1 Existing Core Tables

The current backend already includes these important tables:

```text
Customers
Designers
Designs
DesignImages
requests
requestImages
```

### 6.2 Recommended Additional Tables

As the application grows, these tables should be added:

```text
Orders
Payments
Notifications
Measurements
Reviews
```

### 6.3 Main Relationships

```text
Customer hasMany Requests
Customer hasMany Orders
Customer hasMany Measurements
Customer hasMany Reviews

Designer hasMany Designs
Designer hasMany Requests
Designer hasMany Orders
Designer hasMany Reviews

Design belongsTo Designer
Design hasMany DesignImages

Request belongsTo Customer
Request belongsTo Designer
Request hasMany RequestImages
Request may haveOne Order

Order belongsTo Customer
Order belongsTo Designer
Order may belongTo Request
Order may belongTo Design

Payment belongsTo Order

Notification belongsTo Customer or Designer

Review belongsTo Customer
Review belongsTo Designer
Review belongsTo Order
```

## 7. Suggested Data Model

### Customers

Stores customer account and profile information.

Important fields:

```text
id
firstName
lastName
email
password
otp
otpExpire
role
isEmailVerified
profilePhoto
createdAt
updatedAt
```

### Designers

Stores designer account and profile information.

Important fields:

```text
id
firstName
lastName
email
password
otp
otpExpire
role
isEmailVerified
profilePhoto
bio
location
experienceLevel
createdAt
updatedAt
```

### Designs

Stores designs uploaded by designers.

Important fields:

```text
id
designerId
title
category
price
description
createdAt
updatedAt
```

### DesignImages

Stores images connected to a design.

Important fields:

```text
id
designId
imageUrl
publicId
createdAt
updatedAt
```

The current implementation connects design images to `designerId`. A stronger long-term structure is to connect each image to a specific `designId`, because an image belongs to a design, not only to a designer.

### Requests

Stores customer custom clothing requests.

Important fields:

```text
id
customerId
designerId
fullName
deadline
description
measurement
status
createdAt
updatedAt
```

### RequestImages

Stores reference images for a custom request.

Important fields:

```text
id
requestId
imageUrl
publicId
createdAt
updatedAt
```

### Orders

Stores confirmed jobs or purchases.

Important fields:

```text
id
customerId
designerId
requestId
designId
orderType
amount
status
deliveryAddress
createdAt
updatedAt
```

### Payments

Stores payment records.

Important fields:

```text
id
orderId
amount
provider
reference
status
paidAt
createdAt
updatedAt
```

### Notifications

Stores in-app notifications.

Important fields:

```text
id
recipientId
recipientType
title
message
isRead
createdAt
updatedAt
```

## 8. Main Application Flows

### 8.1 Customer Registration Flow

```text
1. Customer submits registration details.
2. Backend validates the request body.
3. Backend checks if email already exists.
4. Password is hashed.
5. Customer account is created.
6. OTP is generated and saved.
7. Verification email is sent.
8. Customer verifies email using OTP.
9. Account becomes active.
```

### 8.2 Designer Registration Flow

```text
1. Designer submits registration details.
2. Backend validates the request body.
3. Backend checks if email already exists.
4. Password is hashed.
5. Designer account is created.
6. OTP is generated and saved.
7. Verification email is sent.
8. Designer verifies email.
9. Designer can create designs and receive requests.
```

### 8.3 Design Upload Flow

```text
1. Designer logs in.
2. Designer submits design details.
3. Backend validates designer authentication.
4. Design record is created.
5. Designer uploads one or more images.
6. Images are stored in cloud storage.
7. Image URLs are saved in DesignImages.
8. Design becomes visible to customers.
```

### 8.4 Custom Request Flow

```text
1. Customer logs in.
2. Customer creates a custom clothing request.
3. Customer provides description, deadline, measurements, and optional designer.
4. Customer uploads reference images.
5. Request is saved with pending status.
6. Designer receives notification.
7. Designer accepts or rejects the request.
8. If accepted, request moves to in_progress.
9. Designer updates progress.
10. Request is marked ready_for_delivery.
11. Customer receives final delivery.
12. Request is completed.
```

### 8.5 Order and Payment Flow

```text
1. Customer selects a design or accepted request.
2. Backend creates an order.
3. Payment is initialized through a payment provider.
4. Customer completes payment.
5. Backend verifies payment using provider reference.
6. Payment status is updated.
7. Order status changes to paid.
8. Designer begins work.
9. Order moves through progress statuses until completed.
```

## 9. API Design Standards

The backend should follow consistent REST API conventions.

Successful response example:

```json
{
  "success": true,
  "message": "Request created successfully",
  "data": {}
}
```

Error response example:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

Recommended status codes:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

## 10. Security Considerations

The backend should include the following security practices:

- Hash passwords using bcrypt.
- Never store plain text passwords.
- Use JWT for protected routes.
- Use role-based access control.
- Validate all request bodies.
- Sanitize user input.
- Limit upload file size.
- Allow only safe image file types.
- Store secrets in environment variables.
- Do not commit `.env` files.
- Use HTTPS in production.
- Add rate limiting to login, OTP, and password reset routes.
- Use secure CORS configuration.

## 11. Error Handling

The backend should use one central error middleware. Controllers should avoid repeating large try-catch blocks where possible. Service functions can throw meaningful errors, and the error middleware should format the final API response.

Recommended error middleware responsibilities:

- Catch unknown server errors.
- Return consistent JSON error responses.
- Hide sensitive internal details in production.
- Log errors for debugging.

## 12. Validation

Validation should happen before data reaches the controller logic.

Recommended validation libraries:

- Joi
- Zod
- express-validator

Validation should be used for:

- Registration
- Login
- Design creation
- Request creation
- Order creation
- Payment verification
- Profile updates

## 13. File Upload Strategy

The application should not store images directly inside MySQL. Instead:

```text
1. User uploads image.
2. Backend validates image.
3. Backend uploads image to Cloudinary or S3.
4. Storage provider returns image URL and public ID.
5. Backend saves image URL and public ID in MySQL.
```

This keeps the database lightweight and makes image delivery faster.

## 14. Deployment Architecture

A simple production deployment can use:

```text
Frontend:
Vercel / Netlify

Backend:
Render / Railway / DigitalOcean / AWS EC2

Database:
Managed MySQL database

Image Storage:
Cloudinary / AWS S3

Email:
SendGrid / Mailgun / Gmail SMTP for early testing

Payment:
Paystack / Flutterwave
```

Production environment variables should include:

```text
NODE_ENV
PORT
DB_HOST
DB_USERNAME
DB_PASSWORD
DB_NAME
JWT_SECRET
JWT_EXPIRES_IN
EMAIL_USER
EMAIL_PASSWORD
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
PAYMENT_SECRET_KEY
```

## 15. Future Scaling Plan

At the current stage, the system should remain a modular monolith. This is simpler, faster, and easier to maintain.

If traffic increases, the system can later be separated into services:

```text
Authentication Service
Design Catalog Service
Request and Order Service
Payment Service
Notification Service
Upload Service
```

Before moving to microservices, the application should first improve:

- Code organization.
- Database indexing.
- Query performance.
- Caching.
- Background jobs.
- Logging and monitoring.

## 16. Recommended Development Roadmap

### Phase 1: Stabilize Current Backend

- Fix migration consistency.
- Align model names and table names.
- Add validation middleware.
- Add centralized error handling.
- Make authentication consistent for customers and designers.

### Phase 2: Complete Core Features

- Customer request creation.
- Request image upload.
- Designer design upload.
- Design image upload.
- Request status updates.
- Customer and designer dashboards.

### Phase 3: Add Business Features

- Orders.
- Payments.
- Notifications.
- Reviews.
- Measurements.

### Phase 4: Production Readiness

- Secure environment variables.
- Add logging.
- Add rate limiting.
- Add API documentation.
- Add tests.
- Deploy backend and database.

## 17. Conclusion

The best architecture for Stitch Sure is a modular monolithic backend built with Express.js, Sequelize, and MySQL. This structure gives the project a clean foundation while keeping development practical. The system should be organized around clear business modules: authentication, customers, designers, designs, custom requests, uploads, orders, payments, and notifications.

This architecture supports the current needs of the application and leaves room for future growth. As the platform gains more users, individual modules such as payments, notifications, and uploads can be separated into independent services if necessary. For now, a well-organized modular monolith is the most reliable and maintainable choice.
