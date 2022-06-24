import db from './_utils/db';
import authenticate from './_utils/auth';

export default async (req, res) => {
	const { body } = req;
	const { headers } = req;
	const { authorization } = headers;

	// First, check if the API request is authorized
	if (!authorization || authorization.indexOf('Basic ') !== 0 || authenticate(authorization) === false)
		return res.status(401).json({ message: 'Unauthorized' });


	// Second, check if the collection name is present in the req.body
	const { collectionName } = body;

	if (!collectionName)
		return res.status(400).json({ message: 'Please provide a valid collection name' })


	/**
	 * Now that we have everything that is needed,
	 * let's do the heavy lifting to get the database connection instance
	 * and return the desired result.
	*/

	try {
		const databaseConnection = await db();
		const collection = databaseConnection.collection(collectionName);

		// Conduct the database operation based on the HTTP method
		switch (req.method) {
			case 'GET': {
				return res.status(200).json({ data: await collection.find({}).toArray() });
			}

			case 'PUT': {
				const { filter, document } = body;
				return res.status(200).json({ data: await collection.updateOne(filter, { $set: document }, { upsert: true }) });
			}

			case 'POST': {
				const { document } = body;
				return res.status(200).json({ data: await collection.insertOne(document) });
			}

			case 'DELETE': {
				const { filter } = body;
				return res.status(200).json({ data: await collection.deleteOne(filter) });
			}

			default:
				return res.status(400).json({ message: 'HTTP Method not supported' });
		}

	} catch (e) {
		console.error(e);
		res.status(500).json({ message: 'Internal Sever Error' })
	}
}
