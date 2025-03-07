# URL Shortener Project

This project implements a URL shortener service using AWS services. It consists of two Lambda functions:
1. **Shorten URL Function**: Accepts a long URL, generates a short code, stores it in DynamoDB, and returns a short URL.
2. **Redirect URL Function**: Retrieves the original long URL from DynamoDB using the short code.

The service is exposed via an API Gateway and is accessible using your custom domain. Route53 is used to map the API Gateway endpoint to your domain, and ACM provides the necessary SSL certificate.

---

## Architecture Overview

- **DynamoDB**: A table named `URLShortener` is used to store the short code, original long URL, and creation timestamp.
  - **Primary Key**: `shortCode` (String)
- **Lambda Functions**:
  - **Shorten URL Lambda**: Uses `PutItemCommand` to store a new record in DynamoDB. It uses the SHA-256 hash of the long URL (first 6 characters) as the short code.
  - **Redirect URL Lambda**: Uses `GetItemCommand` to retrieve the long URL by its short code and issues a 301 redirect.
- **API Gateway**: Triggers the Lambda functions. One endpoint (POST) is used for URL shortening, and another endpoint (GET with path parameter) is used for redirection.
- **Route53**: Configured with an alias record to point your custom domain to the API Gateway URL.
- **ACM (AWS Certificate Manager)**: Provides an SSL certificate for your custom domain to enable HTTPS.
- **Environment Variables**: The Lambda function responsible for shortening URLs uses an environment variable (`API_BASE_URL`) set to your domain (e.g., `https://syedirfan.in`) so that the generated short URLs look like `https://syedirfan.in/<shortCode>`.

---
## Detailed Setup Instructions

### 1. DynamoDB Table

- **Table Name**: `URLShortener`
- **Primary Key**: `shortCode` (String)
  
Create the table in the AWS Console or using AWS CLI:
```bash
aws dynamodb create-table \
    --table-name URLShortener \
    --attribute-definitions AttributeName=shortCode,AttributeType=S \
    --key-schema AttributeName=shortCode,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```
### 2. Lambda Functions

You need to create **two Lambda functions**:
#### a. URL Shortening Lambda

- IAM Role: Create or select an execution role with permissions for DynamoDB operations (dynamodb:PutItem and dynamodb:GetItems). You can attach a policy with DynamoDB full access or limit it to Put/Get operations.

- Environment Variables:
	 Set API_BASE_URL to your custom domain.

#### b. URL Redirection Lambda
- Use the same execution role for this lambda function as well.

### 3. API Gateway Setup

- **Integration**:
    - Create an API Gateway (HTTP API) and add two routes:
        - A `POST` route with path parameter `/create` for URL shortening which triggers the URL Shortening Lambda.
        - A `GET` route with a path parameter `/{shortCode}` that triggers the URL Redirection Lambda.
- **API Gateway URL**:  
After deployment, copy the API Gateway invoke URL. This URL will later be used for custom domain mapping in Route53.

### 4. Custom Domain with Route53 and ACM

- **ACM Setup**:
    - Request a public certificate in AWS Certificate Manager for your domain.
    - Validate the certificate using DNS validation.
- **API Gateway Custom Domain**:
    - Associate the ACM certificate with a custom domain name in API Gateway.
    - Map your API Gateway stage to this custom domain.
- **Route53 Alias Record**:
    - In Route53, create an alias record that points your domain `<your-domain-name>` to the API Gateway custom domain endpoint.
    - This allows users to access your API via `<you-domain-name>`

### 5. Environment Variables
Ensure that the Shorten URL Lambda has an environment variable set:

API_BASE_URL: `your-domain-name`
This variable is used to build the final short URL returned to the client.

---
## Testing the Service Using CLI

### Using AWS CLI to Invoke Lambdas

You can test your Lambda functions using the AWS CLI. For example, to test the URL shortening Lambda:
```bash
aws lambda invoke \
    --function-name <YourShortenLambdaFunctionName> \
    --payload '{"text": "https://example.com"}' \
    output.json
```
Then inspect the `output.json` file for the returned short URL.

### Testing via API Gateway Using `curl`

1. **Test URL Shortening Endpoint**:
```bash
	curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"text": "https://example.com"}' \
  https://<domain-name>/create
```
2. **Test URL Redirection Endpoint**: Once you receive a short URL test the redirection:
```bash
curl -I https://syedirfan.in/abc123
```
