import type { RequestHandler } from "express";
import { storage } from "./storage";
import type { UserRole, CommunityRole } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { subCommunityAdmins, communities } from "@shared/schema";

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
      
      // Super admin and developer can access everything
      if (userRole === "super_admin" || userRole === "developer") {
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
    
    // Super admin, developer, or community admin can access
    if (userRole === "super_admin" || userRole === "developer" || userRole === "community_admin") {
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
      
      // Super admin and developer can access everything
      if (userRole === "super_admin" || userRole === "developer") {
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
      
      // Super admin and developer can access everything
      if (userRole === "super_admin" || userRole === "developer") {
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
    
    // Super admin and developer can access everything
    if (userRole === "super_admin" || userRole === "developer") {
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

    // Global collections can be accessed by community admins and developers
    if (collection.type === "global" && (userRole === "community_admin" || userRole === "developer")) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking collection access:", error);
    return false;
  }
};

// Middleware to check if user is a sub-community admin for a specific sub-community
export const requireSubCommunityAdmin = (subCommunityIdParam = "subCommunityId"): RequestHandler => {
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
      
      // Super admin and developer can access everything
      if (userRole === "super_admin" || userRole === "developer") {
        req.userRole = userRole;
        return next();
      }

      // Get sub-community ID from request params or body
      const subCommunityId = req.params[subCommunityIdParam] || req.body.subCommunityId;
      
      if (!subCommunityId) {
        return res.status(400).json({ message: "Sub-community ID required" });
      }

      // Check if user is sub-community admin
      if (userRole === "sub_community_admin") {
        const isAdmin = await isSubCommunityAdmin(userId, subCommunityId);
        if (isAdmin) {
          req.userRole = userRole;
          req.subCommunityId = subCommunityId;
          return next();
        }
      }

      // Check if user is a community admin with parent access
      if (userRole === "community_admin") {
        const hasAccess = await hasParentCommunityAccess(userId, subCommunityId);
        if (hasAccess) {
          req.userRole = userRole;
          req.subCommunityId = subCommunityId;
          return next();
        }
      }

      return res.status(403).json({ message: "Not authorized for this sub-community" });
    } catch (error) {
      console.error("Error checking sub-community admin role:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Middleware to check if user is member of specific sub-community
export const requireSubCommunityMember = (subCommunityIdParam = "subCommunityId"): RequestHandler => {
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
      
      // Super admin and developer can access everything
      if (userRole === "super_admin" || userRole === "developer") {
        req.userRole = userRole;
        return next();
      }

      // Get sub-community ID from request params or body
      const subCommunityId = req.params[subCommunityIdParam] || req.body.subCommunityId;
      
      if (!subCommunityId) {
        return res.status(400).json({ message: "Sub-community ID required" });
      }

      // Get the sub-community to find its parent
      const subCommunity = await db.select()
        .from(communities)
        .where(eq(communities.id, subCommunityId))
        .limit(1);

      if (!subCommunity.length) {
        return res.status(404).json({ message: "Sub-community not found" });
      }

      // Check if user is a member of the sub-community's parent community
      if (subCommunity[0].parentCommunityId) {
        const isMember = await storage.isCommunityMember(userId, subCommunity[0].parentCommunityId);
        
        // Also check if user has specific sub-community access
        const userCommunities = await storage.getUserCommunities(userId);
        const hasSubCommunityAccess = userCommunities.some(
          uc => uc.subCommunityId === subCommunityId
        );
        
        if (isMember || hasSubCommunityAccess) {
          req.userRole = userRole;
          req.subCommunityId = subCommunityId;
          return next();
        }
      }

      // Check if user is a sub-community admin for this sub-community
      if (userRole === "sub_community_admin" && await isSubCommunityAdmin(userId, subCommunityId)) {
        req.userRole = userRole;
        req.subCommunityId = subCommunityId;
        return next();
      }

      // Check if user is a community admin with parent access
      if (userRole === "community_admin" && await hasParentCommunityAccess(userId, subCommunityId)) {
        req.userRole = userRole;
        req.subCommunityId = subCommunityId;
        return next();
      }

      return res.status(403).json({ message: "Not a member of this sub-community" });
    } catch (error) {
      console.error("Error checking sub-community membership:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Helper function to check if user can manage a sub-community
export const canManageSubCommunity = async (userId: string, subCommunityId: string): Promise<boolean> => {
  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      return false;
    }

    const userRole = user.role as UserRole;
    
    // Super admin and developer can manage everything
    if (userRole === "super_admin" || userRole === "developer") {
      return true;
    }

    // Check if user is a sub-community admin for this specific sub-community
    if (userRole === "sub_community_admin") {
      return await isSubCommunityAdmin(userId, subCommunityId);
    }

    // Check if user is a community admin with parent access
    if (userRole === "community_admin") {
      return await hasParentCommunityAccess(userId, subCommunityId);
    }

    return false;
  } catch (error) {
    console.error("Error checking sub-community management access:", error);
    return false;
  }
};

// Helper function to check if user is admin of specific sub-community
export const isSubCommunityAdmin = async (userId: string, subCommunityId: string): Promise<boolean> => {
  try {
    const adminRecord = await db.select()
      .from(subCommunityAdmins)
      .where(
        and(
          eq(subCommunityAdmins.userId, userId),
          eq(subCommunityAdmins.subCommunityId, subCommunityId)
        )
      )
      .limit(1);

    return adminRecord.length > 0;
  } catch (error) {
    console.error("Error checking sub-community admin status:", error);
    return false;
  }
};

// Helper function to get the materialized path for permission checking
export const getSubCommunityPath = async (communityId: string): Promise<string | null> => {
  try {
    const community = await db.select()
      .from(communities)
      .where(eq(communities.id, communityId))
      .limit(1);

    if (!community.length) {
      return null;
    }

    return community[0].path || null;
  } catch (error) {
    console.error("Error getting sub-community path:", error);
    return null;
  }
};

// Helper function to check if user has access through parent community
export const hasParentCommunityAccess = async (userId: string, subCommunityId: string): Promise<boolean> => {
  try {
    // Get the sub-community details
    const subCommunity = await db.select()
      .from(communities)
      .where(eq(communities.id, subCommunityId))
      .limit(1);

    if (!subCommunity.length) {
      return false;
    }

    const subCommData = subCommunity[0];
    
    // If there's no parent, check if user is a community admin for this root community
    if (!subCommData.parentCommunityId) {
      return await storage.isCommunityAdmin(userId, subCommunityId);
    }

    // Check if user is admin of parent community
    const isParentAdmin = await storage.isCommunityAdmin(userId, subCommData.parentCommunityId);
    
    if (isParentAdmin) {
      return true;
    }

    // If the community has a path, check all ancestors in the hierarchy
    if (subCommData.path) {
      // Path format is typically like: /root_id/parent_id/sub_id
      const pathParts = subCommData.path.split('/').filter(p => p);
      
      // Check if user is admin of any ancestor community
      for (const ancestorId of pathParts) {
        if (ancestorId !== subCommunityId) {
          const isAncestorAdmin = await storage.isCommunityAdmin(userId, ancestorId);
          if (isAncestorAdmin) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking parent community access:", error);
    return false;
  }
};