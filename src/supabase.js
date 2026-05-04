import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yryeduhbowvngdrstvgp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVkdWhib3d2bmdkcnN0dmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTEwODcsImV4cCI6MjA5MzQyNzA4N30.hm6lpu-S_wvQQAW3-EJiggwXKmYXtI3wp5pPkgfME1o'

export const supabase = createClient(supabaseUrl, supabaseKey)