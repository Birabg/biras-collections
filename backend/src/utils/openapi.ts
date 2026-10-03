import { config } from '../config/env';

/*
 * OpenAPI document.
 *
 * Written by hand rather than generated so the contract is reviewable in a diff
 * and carries the intent comments that matter (which fields the server
 * deliberately refuses to accept, and which responses are authorised).
 */

const errorResponse = {
  description: 'Error',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
};

const jsonBody = (schema: unknown) => ({
  required: true,
  content: { 'application/json': { schema } },
});

const paginatedList = (itemRef: string) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'array', items: { $ref: itemRef } },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
  },
});

const bearer = [{ bearerAuth: [] }];

export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: "Bira's Collections API",
    version: '1.0.0',
    description:
      'Secure, transactional commerce API for Bira’s Collections.\n\n' +
      '**Authentication.** Obtain an access token from `/api/v1/auth/login` or ' +
      '`/api/v1/auth/register` and send it as `Authorization: Bearer <token>`. ' +
      'The refresh token is set as an HTTP-only cookie and must be sent by the ' +
      'browser automatically; it is never returned in a response body.\n\n' +
      '**Ownership.** Customer endpoints derive the user from the verified token. ' +
      'There is no `userId` parameter on any customer route, so one account ' +
      'cannot read or modify another account’s cart, wishlist, addresses or orders.\n\n' +
      '**Money and stock are never client-supplied.** Prices, discounts, delivery ' +
      'fees, totals and stock levels are computed inside the server transaction ' +
      'that writes the order.',
    license: { name: 'UNLICENSED' },
  },
  servers: [
    { url: `http://localhost:${config.port}/api/v1`, description: 'Local development' },
    { url: '/api/v1', description: 'Same origin (proxied)' },
  ],
  tags: [
    { name: 'Auth', description: 'Registration, sessions and password recovery' },
    { name: 'Products', description: 'Public catalogue' },
    { name: 'Cart', description: 'Authenticated cart' },
    { name: 'Wishlist', description: 'Authenticated wishlist' },
    { name: 'Addresses', description: 'Authenticated delivery addresses' },
    { name: 'Orders', description: 'Checkout and order history' },
    { name: 'Admin', description: 'Back-office (ADMIN or SUPER_ADMIN)' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        requestBody: jsonBody({
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password', minLength: 8 },
            firstName: { type: 'string', minLength: 1, maxLength: 80 },
            lastName: { type: 'string', minLength: 1, maxLength: 80 },
            phone: { type: 'string', nullable: true },
            acceptedTerms: { type: 'boolean' },
          },
        }),
        responses: {
          201: {
            description: 'Account created; refresh cookie set',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } } },
          },
          400: errorResponse,
          409: errorResponse,
          429: errorResponse,
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in',
        requestBody: jsonBody({
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        }),
        responses: {
          200: {
            description: 'Signed in; refresh cookie set',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } } },
          },
          401: errorResponse,
          429: errorResponse,
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate the refresh token',
        description:
          'Requires the HTTP-only refresh cookie. The presented token is revoked and a new one issued, so a captured token is single-use.',
        responses: {
          200: {
            description: 'New access and refresh tokens',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } } },
          },
          401: errorResponse,
        },
      },
    },
    '/auth/logout': { post: { tags: ['Auth'], summary: 'Revoke the session and clear the cookie', responses: { 200: { description: 'Signed out' } } } },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Current user and permissions', security: bearer, responses: { 200: { description: 'Current user' }, 401: errorResponse } },
      patch: {
        tags: ['Auth'],
        summary: 'Update own profile',
        description: 'Accepts only name and phone. Role and status fields are ignored.',
        security: bearer,
        requestBody: jsonBody({
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string', nullable: true },
          },
        }),
        responses: { 200: { description: 'Updated user' }, 400: errorResponse, 401: errorResponse },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change password',
        description: 'Revokes every other session for the account on success.',
        security: bearer,
        requestBody: jsonBody({
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', format: 'password' },
            newPassword: { type: 'string', format: 'password', minLength: 8 },
          },
        }),
        responses: { 200: { description: 'Password changed' }, 400: errorResponse, 401: errorResponse },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a reset link',
        description: 'Always returns the same message whether or not the address exists, so the endpoint cannot be used to enumerate accounts.',
        requestBody: jsonBody({
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        }),
        responses: { 200: { description: 'Request accepted' }, 429: errorResponse },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Complete a password reset',
        requestBody: jsonBody({
          type: 'object',
          required: ['token', 'password'],
          properties: { token: { type: 'string' }, password: { type: 'string', format: 'password', minLength: 8 } },
        }),
        responses: { 200: { description: 'Password reset' }, 400: errorResponse },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'Browse the catalogue',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc', 'featured', 'name'] } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
        ],
        responses: { 200: { description: 'Catalogue page', content: { 'application/json': { schema: paginatedList('#/components/schemas/Product') } } } },
      },
    },
    '/products/categories': { get: { tags: ['Products'], summary: 'List categories', responses: { 200: { description: 'Categories' } } } },
    '/products/categories/{slug}': {
      get: { tags: ['Products'], summary: 'Category detail', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Category' }, 404: errorResponse } },
    },
    '/products/{slug}': {
      get: { tags: ['Products'], summary: 'Product detail by slug', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Product' }, 404: errorResponse } },
    },
    '/products/{id}/related': {
      get: { tags: ['Products'], summary: 'Related products', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Related products' } } },
    },
    '/cart': {
      get: { tags: ['Cart'], summary: 'Current cart with computed totals', security: bearer, responses: { 200: { description: 'Cart' }, 401: errorResponse } },
      post: { tags: ['Cart'], summary: 'Add a line', security: bearer, requestBody: jsonBody({ $ref: '#/components/schemas/AddToCart' }), responses: { 201: { description: 'Updated cart' }, 400: errorResponse, 409: errorResponse } },
      delete: { tags: ['Cart'], summary: 'Empty the cart', security: bearer, responses: { 200: { description: 'Empty cart' } } },
    },
    '/cart/{id}': {
      patch: { tags: ['Cart'], summary: 'Set line quantity', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: jsonBody({ type: 'object', required: ['quantity'], properties: { quantity: { type: 'integer', minimum: 1 } } }), responses: { 200: { description: 'Updated cart' }, 404: errorResponse } },
      delete: { tags: ['Cart'], summary: 'Remove a line', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Updated cart' }, 404: errorResponse } },
    },
    '/wishlist': {
      get: { tags: ['Wishlist'], summary: 'Wishlist contents', security: bearer, responses: { 200: { description: 'Wishlist' } } },
      post: { tags: ['Wishlist'], summary: 'Add a product', security: bearer, requestBody: jsonBody({ type: 'object', required: ['productId'], properties: { productId: { type: 'string', format: 'uuid' } } }), responses: { 201: { description: 'Updated wishlist' } } },
      delete: { tags: ['Wishlist'], summary: 'Remove a product', security: bearer, requestBody: jsonBody({ type: 'object', required: ['productId'], properties: { productId: { type: 'string', format: 'uuid' } } }), responses: { 200: { description: 'Updated wishlist' } } },
    },
    '/wishlist/toggle': {
      post: { tags: ['Wishlist'], summary: 'Toggle membership', security: bearer, requestBody: jsonBody({ type: 'object', required: ['productId'], properties: { productId: { type: 'string', format: 'uuid' } } }), responses: { 200: { description: 'Updated wishlist and new state' } } },
    },
    '/wishlist/{productId}': { get: { tags: ['Wishlist'], summary: 'Check membership', security: bearer, parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Membership flag' } } } },
    '/addresses': {
      get: { tags: ['Addresses'], summary: 'List own addresses', security: bearer, responses: { 200: { description: 'Addresses' } } },
      post: { tags: ['Addresses'], summary: 'Create an address', security: bearer, requestBody: jsonBody({ $ref: '#/components/schemas/Address' }), responses: { 201: { description: 'Created address' }, 400: errorResponse } },
    },
    '/addresses/{id}': {
      get: { tags: ['Addresses'], summary: 'Read one own address', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Address' }, 404: errorResponse } },
      patch: { tags: ['Addresses'], summary: 'Update an address', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: jsonBody({ $ref: '#/components/schemas/Address' }), responses: { 200: { description: 'Updated address' }, 404: errorResponse } },
      delete: { tags: ['Addresses'], summary: 'Delete an address', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Deleted' }, 404: errorResponse } },
    },
    '/addresses/{id}/default': { post: { tags: ['Addresses'], summary: 'Make an address the default', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Updated addresses' } } } },
    '/checkout': { get: { tags: ['Orders'], summary: 'Checkout preview: cart, delivery options and totals', security: bearer, responses: { 200: { description: 'Checkout summary' }, 401: errorResponse } } },
    '/orders': {
      get: { tags: ['Orders'], summary: 'Own order history', security: bearer, parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'status', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'Orders', content: { 'application/json': { schema: paginatedList('#/components/schemas/Order') } } } } },
      post: {
        tags: ['Orders'],
        summary: 'Place an order',
        description:
          'Validates stock, recomputes prices, decrements inventory and clears the cart in a single serialisable transaction. A concurrent order that would oversell a variant is rejected with 409 rather than partially applied.',
        security: bearer,
        requestBody: jsonBody({ $ref: '#/components/schemas/CreateOrder' }),
        responses: { 201: { description: 'Order placed' }, 400: errorResponse, 409: errorResponse },
      },
    },
    '/orders/{id}': { get: { tags: ['Orders'], summary: 'Read one own order by id or order number', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Order' }, 404: errorResponse } } },
    '/admin/dashboard': { get: { tags: ['Admin'], summary: 'Aggregated dashboard metrics', security: bearer, responses: { 200: { description: 'Dashboard' }, 403: errorResponse } } },
    '/admin/reports/sales': { get: { tags: ['Admin'], summary: 'Sales over time', security: bearer, parameters: [{ name: 'from', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'interval', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month'], default: 'day' } }], responses: { 200: { description: 'Sales report' } } } },
    '/admin/reports/orders': { get: { tags: ['Admin'], summary: 'Orders grouped by status and payment status', security: bearer, responses: { 200: { description: 'Orders report' } } } },
    '/admin/reports/products': { get: { tags: ['Admin'], summary: 'Best and worst sellers', security: bearer, responses: { 200: { description: 'Product report' } } } },
    '/admin/reports/categories': { get: { tags: ['Admin'], summary: 'Revenue share per category', security: bearer, responses: { 200: { description: 'Category report' } } } },
    '/admin/orders': { get: { tags: ['Admin'], summary: 'All orders', security: bearer, parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'search', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'Orders with summary totals' } } } },
    '/admin/orders/{id}': { get: { tags: ['Admin'], summary: 'Order detail', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Order' }, 404: errorResponse } } },
    '/admin/orders/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Advance an order',
        description: 'Cancelling an order restores its reserved stock in the same transaction. Status history is recorded with the acting user.',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: jsonBody({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] }, note: { type: 'string', maxLength: 300 } } }),
        responses: { 200: { description: 'Updated order' }, 400: errorResponse, 403: errorResponse, 409: errorResponse },
      },
    },
    '/admin/customers': { get: { tags: ['Admin'], summary: 'List customers', security: bearer, responses: { 200: { description: 'Customers' } } } },
    '/admin/customers/{id}': { get: { tags: ['Admin'], summary: 'Customer detail with order history', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Customer' }, 404: errorResponse } } },
    '/admin/customers/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Enable or disable an account',
        description: 'Disabling revokes all of that account’s refresh tokens, so the change takes effect immediately.',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: jsonBody({ type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean' } } }),
        responses: { 200: { description: 'Updated customer' }, 404: errorResponse },
      },
    },
    '/admin/customers/{id}/role': {
      patch: {
        tags: ['Admin'],
        summary: 'Change a role',
        description: 'Only a SUPER_ADMIN may grant SUPER_ADMIN, and nobody may change their own role. The change revokes live sessions so old privilege levels do not persist.',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: jsonBody({ type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'] } } }),
        responses: { 200: { description: 'Updated user' }, 403: errorResponse },
      },
    },
    '/admin/inventory': { get: { tags: ['Admin'], summary: 'Variant stock levels', security: bearer, responses: { 200: { description: 'Inventory page' } } } },
    '/admin/inventory/{id}/adjust': {
      post: {
        tags: ['Admin'],
        summary: 'Adjust stock by a delta',
        description: 'A signed quantity recorded as an InventoryMovement, so every change is attributable.',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: jsonBody({ type: 'object', required: ['quantity', 'reason'], properties: { quantity: { type: 'integer' }, reason: { type: 'string', enum: ['PURCHASE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'RESERVATION', 'RELEASE'] }, note: { type: 'string' } } }),
        responses: { 200: { description: 'Updated variant' }, 400: errorResponse },
      },
    },
    '/admin/inventory/{id}/stock': { put: { tags: ['Admin'], summary: 'Set an absolute stock level', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: jsonBody({ type: 'object', required: ['stockQuantity'], properties: { stockQuantity: { type: 'integer', minimum: 0 } } }), responses: { 200: { description: 'Updated variant' }, 400: errorResponse } } },
    '/admin/inventory/{id}/movements': { get: { tags: ['Admin'], summary: 'Stock movement history', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Movements' } } } },
    '/admin/products': {
      get: { tags: ['Admin'], summary: 'Catalogue including inactive and deleted items', security: bearer, responses: { 200: { description: 'Products' } } },
      post: { tags: ['Admin'], summary: 'Create a product', security: bearer, requestBody: jsonBody({ type: 'object' }), responses: { 201: { description: 'Created product' }, 400: errorResponse } },
    },
    '/admin/products/{id}': {
      get: { tags: ['Admin'], summary: 'Product detail for editing', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Product' }, 404: errorResponse } },
      patch: { tags: ['Admin'], summary: 'Update a product', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: jsonBody({ type: 'object' }), responses: { 200: { description: 'Updated product' } } },
      delete: { tags: ['Admin'], summary: 'Soft-delete a product', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Deleted' }, 404: errorResponse } },
    },
    '/admin/products/{id}/restore': { post: { tags: ['Admin'], summary: 'Restore a soft-deleted product', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Restored product' } } } },
    '/admin/products/{id}/flags': { patch: { tags: ['Admin'], summary: 'Toggle featured/active', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: jsonBody({ type: 'object', properties: { isFeatured: { type: 'boolean' }, isActive: { type: 'boolean' } } }), responses: { 200: { description: 'Updated product' } } } },
    '/admin/categories': { post: { tags: ['Admin'], summary: 'Create a category', security: bearer, requestBody: jsonBody({ type: 'object' }), responses: { 201: { description: 'Created category' } } } },
    '/admin/categories/{id}': {
      patch: { tags: ['Admin'], summary: 'Update a category', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: jsonBody({ type: 'object' }), responses: { 200: { description: 'Updated category' } } },
      delete: { tags: ['Admin'], summary: 'Delete an empty category', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Deleted' }, 409: errorResponse } },
    },
    '/admin/settings': { get: { tags: ['Admin'], summary: 'List store settings', security: bearer, responses: { 200: { description: 'Settings' } } } },
    '/admin/settings/{key}': {
      get: { tags: ['Admin'], summary: 'Read a setting', security: bearer, parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Setting' }, 404: errorResponse } },
      put: { tags: ['Admin'], summary: 'Create or update a setting', security: bearer, parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }], requestBody: jsonBody({ type: 'object', required: ['value'], properties: { value: {} } }), responses: { 200: { description: 'Updated setting' } } },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from `/auth/login` or `/auth/refresh`.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['success', 'message', 'code'],
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'The submitted data is invalid.' },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          details: { description: 'Field-level issues, when applicable' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
          isActive: { type: 'boolean' },
          emailVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResult: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string', description: 'Short-lived JWT for the Authorization header.' },
          expiresIn: { type: 'integer', description: 'Access token lifetime in seconds.' },
        },
      },
      Variant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          sku: { type: 'string' },
          size: { type: 'string', nullable: true },
          color: { type: 'string', nullable: true },
          price: { type: 'number' },
          compareAtPrice: { type: 'number', nullable: true },
          stockQuantity: { type: 'integer' },
          isActive: { type: 'boolean' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number', description: 'Lowest active variant price.' },
          compareAtPrice: { type: 'number', nullable: true },
          category: { type: 'object', nullable: true },
          images: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' } } } },
          variants: { type: 'array', items: { $ref: '#/components/schemas/Variant' } },
          sizes: { type: 'array', items: { type: 'string' } },
          colors: { type: 'array', items: { type: 'string' } },
          stockLevel: { type: 'string', enum: ['in_stock', 'low_stock', 'out_of_stock'] },
          isFeatured: { type: 'boolean' },
        },
      },
      CartLine: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          variantId: { type: 'string', format: 'uuid', nullable: true },
          name: { type: 'string' },
          slug: { type: 'string' },
          image: { type: 'string', nullable: true },
          size: { type: 'string', nullable: true },
          color: { type: 'string', nullable: true },
          unitPrice: { type: 'number' },
          quantity: { type: 'integer' },
          lineTotal: { type: 'number' },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/CartLine' } },
          itemCount: { type: 'integer' },
          subtotal: { type: 'number' },
          shippingFee: { type: 'number' },
          total: { type: 'number' },
          freeShippingThreshold: { type: 'number' },
          currency: { type: 'string', example: 'ETB' },
        },
      },
      Address: {
        type: 'object',
        required: ['fullName', 'phone', 'region', 'city', 'subCity', 'streetAddress'],
        properties: {
          fullName: { type: 'string', minLength: 2 },
          phone: { type: 'string' },
          region: { type: 'string', description: 'Ethiopian region.' },
          city: { type: 'string' },
          subCity: { type: 'string', description: 'Addis Ababa sub-city.' },
          kebele: { type: 'string', nullable: true },
          streetAddress: { type: 'string' },
          additionalInfo: { type: 'string', nullable: true },
          isDefault: { type: 'boolean' },
        },
      },
      AddToCart: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', format: 'uuid' },
          variantId: { type: 'string', format: 'uuid', nullable: true, description: 'Required when the product has multiple variants.' },
          quantity: { type: 'integer', minimum: 1, default: 1 },
        },
      },
      CreateOrder: {
        type: 'object',
        required: ['shippingAddress', 'paymentMethod'],
        properties: {
          shippingAddress: { $ref: '#/components/schemas/Address' },
          paymentMethod: { type: 'string', enum: ['TELEBIRR', 'CBE_BIRR', 'CHAPA', 'CASH_ON_DELIVERY'] },
          customerNote: { type: 'string', nullable: true, maxLength: 500 },
          addressId: { type: 'string', format: 'uuid', nullable: true },
        },
        description: 'Prices, delivery fee, discount, stock and payment status are all derived server-side.',
      },
      OrderItem: {
        type: 'object',
        properties: {
          productId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          variantSku: { type: 'string', nullable: true },
          size: { type: 'string', nullable: true },
          color: { type: 'string', nullable: true },
          image: { type: 'string', nullable: true },
          unitPrice: { type: 'number' },
          quantity: { type: 'integer' },
          subtotal: { type: 'number' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          orderNumber: { type: 'string', example: 'BC-2026-00042' },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
          paymentStatus: { type: 'string', enum: ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED'] },
          paymentMethod: { type: 'string' },
          subtotal: { type: 'number' },
          shippingFee: { type: 'number' },
          discount: { type: 'number' },
          total: { type: 'number' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          shippingAddress: { type: 'object' },
          placedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
} as const;

/* Minimal zero-dependency renderer: a readable reference page, no CDN scripts. */
export const docsPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bira's Collections API</title>
    <style>
      :root { color-scheme: light dark; --line: #e2e0da; --muted: #6b675f; --accent: #8a6a3b; }
      * { box-sizing: border-box; }
      body { margin: 0 auto; max-width: 60rem; padding: 3rem 1.5rem; font: 16px/1.65 system-ui, -apple-system, "Segoe UI", sans-serif; }
      h1 { margin-bottom: .25rem; font-size: 1.9rem; letter-spacing: -.02em; }
      h2 { margin-top: 2.5rem; font-size: 1.15rem; text-transform: uppercase; letter-spacing: .08em; color: var(--accent); }
      p.lede { color: var(--muted); margin-top: 0; }
      .op { display: flex; gap: .75rem; align-items: baseline; padding: .45rem 0; border-top: 1px solid var(--line); }
      .method { font: 600 12px/1 ui-monospace, monospace; padding: .35rem .5rem; border-radius: .3rem; background: #ecebe7; min-width: 4.2rem; text-align: center; }
      .method.get { background: #e4efe6; } .method.post { background: #e6ecf4; }
      .method.patch, .method.put { background: #f3ecdf; } .method.delete { background: #f5e5e3; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .93em; }
      .tag { color: var(--muted); font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; margin-left: auto; }
      a { color: inherit; }
      footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--line); color: var(--muted); font-size: .9rem; }
    </style>
  </head>
  <body>
    <h1>Bira's Collections API</h1>
    <p class="lede">v${openapiDocument.info.version} &middot; machine-readable contract at <a href="/docs.json"><code>/docs.json</code></a></p>
    <div id="root"></div>
    <footer>Access tokens go in <code>Authorization: Bearer &lt;token&gt;</code>. The refresh token is an HTTP-only cookie and is never returned in a response body.</footer>
    <script>
      const doc = ${JSON.stringify(openapiDocument)};
      const root = document.getElementById('root');
      const groups = {};
      for (const [path, ops] of Object.entries(doc.paths)) {
        for (const [method, op] of Object.entries(ops)) {
          const tag = (op.tags && op.tags[0]) || 'Other';
          (groups[tag] ||= []).push({ path, method, summary: op.summary || '' });
        }
      }
      const esc = (s) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
      for (const [tag, ops] of Object.entries(groups)) {
        const h = document.createElement('h2');
        h.textContent = tag;
        root.appendChild(h);
        for (const op of ops) {
          const row = document.createElement('div');
          row.className = 'op';
          row.innerHTML =
            '<span class="method ' + esc(op.method) + '">' + esc(op.method.toUpperCase()) + '</span>' +
            '<code>' + esc(op.path) + '</code>' +
            '<span>' + esc(op.summary) + '</span>';
          root.appendChild(row);
        }
      }
    </script>
  </body>
</html>`;