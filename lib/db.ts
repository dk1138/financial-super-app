import { PlanData } from './types';

/**
 * Cloud Database Interface Stub
 * * To fully implement a backend like ProjectionLab:
 * 1. Run `npm install @supabase/supabase-js`
 * 2. Set up a Supabase Postgres Database with a `plans` table.
 * 3. Replace the contents of these functions with actual Supabase API calls.
 */

export async function savePlanToCloud(userId: string, planName: string, planData: PlanData): Promise<boolean> {
    try {
        console.log(`[Backend Stub] Saving plan '${planName}' to cloud for user ${userId}...`);
        
        // FUTURE IMPLEMENTATION:
        // const { data, error } = await supabase.from('plans').upsert({
        //     user_id: userId,
        //     plan_name: planName,
        //     plan_data: planData,
        //     updated_at: new Date()
        // });
        // if (error) throw error;
        
        return true;
    } catch (error) {
        console.error("Cloud Save Error:", error);
        return false;
    }
}

export async function fetchPlansFromCloud(userId: string): Promise<{name: string, data: PlanData}[]> {
    try {
        console.log(`[Backend Stub] Fetching plans from cloud for user ${userId}...`);
        
        // FUTURE IMPLEMENTATION:
        // const { data, error } = await supabase.from('plans').select('*').eq('user_id', userId);
        // if (error) throw error;
        // return data.map(row => ({ name: row.plan_name, data: row.plan_data }));

        return [];
    } catch (error) {
        console.error("Cloud Fetch Error:", error);
        return [];
    }
}