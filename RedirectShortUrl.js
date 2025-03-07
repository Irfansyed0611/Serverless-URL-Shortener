import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const TABLE_NAME = "URLShortener";

export const handler = async (event) => {
  const shortCode = event.pathParameters?.shortCode;

  try {
    const { Item } = await dynamoClient.send(new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { shortCode: { S: shortCode } }
    }));

    if (!Item) {
      return { statusCode: 404, body: "URL not found" };
    }

    return {
      statusCode: 301,
      headers: { "Location": Item.longUrl.S },
      body: ""
    };
  } catch (err) {
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
