-- ==============================================
-- SUPABASE PUBLIC SCHEMA SQL
-- Run this in Supabase SQL Editor
-- ==============================================

-- Create the public schema tables
-- Note: auth schema already exists in Supabase

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "avatar_url" TEXT,
    "full_name" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- Create Team table
CREATE TABLE "public"."Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- Create Project table
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- Create TeamMember table
CREATE TABLE "public"."TeamMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- ==============================================
-- CREATE INDEXES
-- ==============================================

-- Create unique indexes
CREATE UNIQUE INDEX "profiles_id_key" ON "public"."profiles"("id");
CREATE UNIQUE INDEX "profiles_username_key" ON "public"."profiles"("username");
CREATE UNIQUE INDEX "TeamMember_userId_teamId_key" ON "public"."TeamMember"("userId", "teamId");

-- ==============================================
-- CREATE FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Link profiles to Supabase auth.users
ALTER TABLE "public"."profiles" 
ADD CONSTRAINT "profiles_id_fkey" 
FOREIGN KEY ("id") REFERENCES "auth"."users"("id") 
ON DELETE CASCADE ON UPDATE NO ACTION;

-- Link Project to Team
ALTER TABLE "public"."Project" 
ADD CONSTRAINT "Project_teamId_fkey" 
FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Link TeamMember to Team
ALTER TABLE "public"."TeamMember" 
ADD CONSTRAINT "TeamMember_teamId_fkey" 
FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- ==============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TeamMember" ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- CREATE RLS POLICIES (Example policies - adjust as needed)
-- ==============================================

-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON "public"."profiles"
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "public"."profiles"
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON "public"."profiles"
FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams: Members can see teams they belong to
CREATE POLICY "Users can view teams they belong to" ON "public"."Team"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "public"."TeamMember" 
    WHERE "TeamMember"."teamId" = "Team"."id" 
    AND "TeamMember"."userId" = auth.uid()::text
  )
);

-- Projects: Team members can see projects in their teams
CREATE POLICY "Team members can view projects" ON "public"."Project"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "public"."TeamMember" 
    WHERE "TeamMember"."teamId" = "Project"."teamId" 
    AND "TeamMember"."userId" = auth.uid()::text
  )
);

-- TeamMembers: Users can see team memberships
CREATE POLICY "Users can view team memberships" ON "public"."TeamMember"
FOR SELECT USING (
  "userId" = auth.uid()::text 
  OR EXISTS (
    SELECT 1 FROM "public"."TeamMember" tm 
    WHERE tm."teamId" = "TeamMember"."teamId" 
    AND tm."userId" = auth.uid()::text
  )
);

-- ==============================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function when new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 