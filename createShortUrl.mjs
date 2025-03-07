import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { createHash } from 'node:crypto';

export const handler = async (event) => {
  const client = new DynamoDBClient({ region: "us-east-1" });
  const TABLE_NAME = "URLShortener";
  const body = JSON.parse(event.body || '{}');
  const longUrl = body.text; // Extract plaintext from the body

  if (!longUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing text parameter' }),
    };
  }

  // Use longUrl instead of plaintext
  const sha256Hash = createHash('sha256').update(longUrl).digest('hex');
  const shortCode = sha256Hash.substring(0, 6);

  const command = new PutItemCommand({
    TableName: "URLShortener",
    Item: {
      shortCode: { S: shortCode },
      longURL: { S: longUrl },
      createdAt: { N: Date.now().toString() }
    },
  });

  try {
    const response = await client.send(command);
    console.log(response);
  } catch (err) {
    console.error(err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      shortUrl: `${process.env.API_BASE_URL}/${shortCode}`
    }),
  };
};
