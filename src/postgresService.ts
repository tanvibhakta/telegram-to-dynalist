const { Pool } = require('pg');
import { config } from "./config";

const pool = new Pool({
    user: config.user,
    host:config.host,
    database: config.database,
    password: config.password,
    port: config.databasePort
});

export const getAllItems = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM ids');
        client.release();
        console.log("results, ", result.rows);
        return result.rows;
    } catch (err) {
        console.error(err);
    }
}

export const createRecord = async (telegramId :number, dynalistId :string) => {
    try {
        await pool.query(
            'INSERT INTO ids (telegram_id, dynalist_id) VALUES ($1, $2) RETURNING *',
            [telegramId, dynalistId]
        );
    } catch (error) {
        console.error("Error inserting record:", error);
        throw error;
    }

}

export const getNodeId = async (telegramId:number)=> {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT dynalist_id FROM ids WHERE telegram_id=$1', [telegramId]);
        client.release();
        return result.rows[0].dynalist_id;
    } catch (err) {
        console.error(err);
    }
}