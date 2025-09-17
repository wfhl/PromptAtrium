import type { RequestHandler } from "express";
import { storage } from "./storage";
import type { UserRole, CommunityRole } from "@shared/schema";

// Role-based access control middleware
export const requireRole = (requiredRole: UserRole): RequestHandler => {
  return async (req: any, res, next) => {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const userRole = user.role as UserRole;
      
      // Super admin can access everything
      if (userRole === "super_admin") {
        req.userRole = userRole;
        return next();
      }

      // Check if user has required role
      if (userRole === requiredRole) {
        req.userRole = userRole;
        return next();
      }

      // Community admin can access community_admin level endpoints
      if (requiredRole === "community_admin" && userRole === "community_admin") {
        req.userRole = userRole;
        return next();
      }

      return res.status(403).json({ message: "Insufficient permissions" });
    } catch (error) {
      console.error("Error checking user role:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Middleware to check if user is super admin
export const requireSuperAdmin = requireRole("super_admin");

// Middleware to check if user is developer
export const requireDeveloper = requireRole("developer");

// Middleware to check if user is community admin or higher
export const requireCommunityAdmin: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated() || !req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const userRole = user.role as UserRole;
    
    // Super admin or community admin can access
    if (userRole === "super_admin" || userRole === "community_admin") {
      req.userRole = userRole;
      return next();
    }

    return res.status(403).json({ message: "Insufficient permissions" });
  } catch (error) {
    console.error("Error checking user role:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check if user is admin of specific community
export const requireCommunityAdminRole = (communityIdParam = "communityId"): RequestHandler => {
  return async (req: any, res, next) => {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const userRole = user.role as UserRole;
      
      // Super admin can access everything
      if (userRole === "super_admin") {
        req.userRole = userRole;
        return next();
      }

      // Get community ID from request params or body
      const communityId = req.params[communityIdParam] || req.body.communityId;
      
      if (!communityId) {
        return res.status(400).json({ message: "Community ID required" });
      }

      // Check if user is admin of this specific community
      const isCommunityAdmin = await storage.isCommunityAdmin(userId, communityId);
      
      if (isCommunityAdmin) {
        req.userRole = userRole;
        req.communityId = communityId;
        return next();
      }

      return res.status(403).json({ message: "Not authorized for this community" });
    } catch (error) {
      console.error("Error checking community admin role:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Middleware to check if user is member of specific community
export const requireCommunityMember = (communityIdParam = "communityId"): RequestHandler => {
  return async (req: any, res, next) => {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const userRole = user.role as UserRole;
      
      // Super admin can access everything
      if (userRole === "super_admin") {
        req.userRole = userRole;
        return next();
      }

      // Get community ID from request params or body
      const communityId = req.params[communityIdParam] || req.body.communityId;
      
      if (!communityId) {
        return res.status(400).json({ message: "Community ID required" });
      }

      // Check if user is member of this community
      const isMember = await storage.isCommunityMember(userId, communityId);
      
      if (isMember) {
        req.userRole = userRole;
        req.communityId = communityId;
        return next();
      }

      return res.status(403).json({ message: "Not a member of this community" });
    } catch (error) {
      console.error("Error checking community membership:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Helper function to check if user can access collection
export const canAccessCollection = async (userId: string, collectionId: string): Promise<boolean> => {
  try {
    const collection = await storage.getCollection(collectionId);
    
    if (!collection) {
      return false;
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return false;
    }

    const userRole = user.role as UserRole;
    
    // Super admin can access everything
    if (userRole === "super_admin") {
      return true;
    }

    // User can access their own collections
    if (collection.userId === userId) {
      return true;
    }

    // Public collections can be accessed by anyone
    if (collection.isPublic) {
      return true;
    }

    // For community collections, check membership
    if (collection.type === "community" && collection.communityId) {
      const isMember = await storage.isCommunityMember(userId, collection.communityId);
      return isMember;
    }

    // Global collections can be accessed by community admins
    if (collection.type === "global" && userRole === "community_admin") {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking collection access:", error);
    return false;
  }
};