import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { storage } from "../storage";
import { 
  users, 
  prompts, 
  userCommunities, 
  communities,
  likes,
  communityAdmins,
  subCommunityAdmins,
  collections,
  prompts_to_collections
} from "@shared/schema";
import { 
  requireSuperAdmin, 
  requireCommunityAdminRole,
  requireRole 
} from "../rbac";
import { isAuthenticated } from "../replitAuth";
import { sql, eq, desc, asc, and, or, gte, lte, count, sum } from "drizzle-orm";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

const router = Router();

// System statistics for super admins
// NOTE: Currently returns mock data for demonstration. In production, integrate with:
// - Real storage metrics from object storage service
// - Actual database performance metrics
// - Application monitoring service (e.g., Prometheus, DataDog)
// - Security event tracking system
router.get("/system-stats", isAuthenticated, requireSuperAdmin, async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    
    // User statistics
    const totalUsers = await db.select({ count: count() }).from(users);
    const newUsers7d = await db.select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, weekAgo));
    
    const active24h = await db.select({ count: count() })
      .from(users)
      .where(gte(users.lastActive, subDays(now, 1)));
    
    // Calculate growth percentage
    const previousWeekUsers = await db.select({ count: count() })
      .from(users)
      .where(and(
        gte(users.createdAt, subDays(now, 14)),
        lte(users.createdAt, weekAgo)
      ));
    
    const userGrowth = previousWeekUsers[0].count > 0 
      ? ((newUsers7d[0].count - previousWeekUsers[0].count) / previousWeekUsers[0].count) * 100
      : 0;

    // Content statistics
    const totalPrompts = await db.select({ count: count() }).from(prompts);
    const newPromptsToday = await db.select({ count: count() })
      .from(prompts)
      .where(gte(prompts.createdAt, startOfDay(now)));
    const featuredPrompts = await db.select({ count: count() })
      .from(prompts)
      .where(eq(prompts.is_featured, true));

    // Storage statistics (mock data for now - would need actual storage metrics)
    const storageUsed = Math.floor(Math.random() * 50000000000); // Mock: 0-50GB
    const storageTotal = 100000000000; // Mock: 100GB
    const storagePercentage = Math.round((storageUsed / storageTotal) * 100);

    // Database health (mock data - would need actual DB metrics)
    const dbSize = Math.floor(Math.random() * 5000000000); // Mock: 0-5GB
    const dbConnections = Math.floor(Math.random() * 50) + 10;
    const dbQueryTime = Math.floor(Math.random() * 50) + 5;
    const dbHealth = dbQueryTime < 20 ? "healthy" : dbQueryTime < 50 ? "warning" : "critical";

    // Performance metrics (mock data - would need actual monitoring)
    const uptime = Math.floor(Math.random() * 604800) + 86400; // 1-7 days in seconds
    const responseTime = Math.floor(Math.random() * 100) + 20;
    const errorRate = Math.random() * 5;
    const requestsPerMin = Math.floor(Math.random() * 1000) + 100;

    // Security metrics (mock data - would need actual security monitoring)
    const failedLogins = Math.floor(Math.random() * 50);
    const suspiciousActivity = Math.floor(Math.random() * 10);
    const lastSecurityScan = subDays(now, Math.floor(Math.random() * 7));
    const securityStatus = suspiciousActivity < 5 ? "secure" : suspiciousActivity < 10 ? "warning" : "critical";

    res.json({
      users: {
        total: totalUsers[0].count,
        active24h: active24h[0].count,
        new7d: newUsers7d[0].count,
        growth: userGrowth
      },
      content: {
        totalPrompts: totalPrompts[0].count,
        totalImages: Math.floor(totalPrompts[0].count * 0.7), // Mock estimate
        newToday: newPromptsToday[0].count,
        featured: featuredPrompts[0].count
      },
      storage: {
        used: storageUsed,
        total: storageTotal,
        percentage: storagePercentage,
        trending: storagePercentage > 70 ? "up" : "stable"
      },
      database: {
        size: dbSize,
        connections: dbConnections,
        queryTime: dbQueryTime,
        health: dbHealth
      },
      performance: {
        uptime,
        responseTime,
        errorRate,
        requestsPerMin
      },
      security: {
        failedLogins,
        suspiciousActivity,
        lastSecurityScan,
        status: securityStatus
      }
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({ message: "Failed to fetch system statistics" });
  }
});

// Health checks for various services
router.get("/health-checks", isAuthenticated, requireSuperAdmin, async (req, res) => {
  try {
    const checks = [];
    
    // Database check
    const dbStart = Date.now();
    try {
      await db.select({ count: count() }).from(users);
      checks.push({
        service: "Database",
        status: "operational",
        responseTime: Date.now() - dbStart,
        lastCheck: new Date()
      });
    } catch {
      checks.push({
        service: "Database",
        status: "down",
        responseTime: -1,
        lastCheck: new Date()
      });
    }

    // API check
    checks.push({
      service: "API",
      status: "operational",
      responseTime: Math.floor(Math.random() * 50) + 10,
      lastCheck: new Date()
    });

    // Storage check (mock)
    checks.push({
      service: "Storage",
      status: Math.random() > 0.95 ? "degraded" : "operational",
      responseTime: Math.floor(Math.random() * 100) + 20,
      lastCheck: new Date()
    });

    // Auth service check (mock)
    checks.push({
      service: "Authentication",
      status: "operational",
      responseTime: Math.floor(Math.random() * 30) + 5,
      lastCheck: new Date()
    });

    res.json(checks);
  } catch (error) {
    console.error("Error performing health checks:", error);
    res.status(500).json({ message: "Failed to perform health checks" });
  }
});

// Moderation endpoints
router.get("/moderation/flagged", isAuthenticated, requireRole("community_admin"), async (req: any, res) => {
  try {
    const { status = "pending", priority, type } = req.query;
    const userId = req.user.claims.sub;
    const userRole = req.userRole;

    // For community admins, only show content from their communities
    let communityIds: string[] = [];
    if (userRole === "community_admin") {
      const adminCommunities = await db.select()
        .from(communityAdmins)
        .where(eq(communityAdmins.userId, userId));
      
      const subAdminCommunities = await db.select()
        .from(subCommunityAdmins)
        .where(eq(subCommunityAdmins.userId, userId));
      
      communityIds = [
        ...adminCommunities.map(c => c.communityId),
        ...subAdminCommunities.map(c => c.subCommunityId)
      ];
    }

    // Mock flagged content for now
    const flaggedContent = [
      {
        id: "flag-1",
        type: "prompt",
        content: {
          id: "prompt-1",
          content: "This is a sample flagged prompt that violates community guidelines...",
          title: "Inappropriate Content"
        },
        reporter: {
          id: "user-1",
          username: "reporter123",
          email: "reporter@example.com"
        },
        reportedUser: {
          id: "user-2",
          username: "violator456",
          email: "violator@example.com"
        },
        reason: "Inappropriate content",
        description: "This prompt contains explicit material that violates our community guidelines",
        status,
        priority: priority || "medium",
        createdAt: subDays(new Date(), 1),
        reviewedAt: status === "resolved" ? new Date() : undefined
      },
      {
        id: "flag-2",
        type: "image",
        content: {
          id: "img-1",
          url: "/placeholder.jpg",
          description: "Flagged image content"
        },
        reporter: {
          id: "user-3",
          username: "concerned_user",
          email: "concerned@example.com"
        },
        reportedUser: {
          id: "user-4",
          username: "image_poster",
          email: "poster@example.com"
        },
        reason: "NSFW content not properly tagged",
        description: "This image contains adult content but was not marked as NSFW",
        status,
        priority: "high",
        createdAt: subDays(new Date(), 2)
      }
    ];

    res.json(flaggedContent);
  } catch (error) {
    console.error("Error fetching flagged content:", error);
    res.status(500).json({ message: "Failed to fetch flagged content" });
  }
});

router.get("/moderation/stats", isAuthenticated, requireRole("community_admin"), async (req, res) => {
  try {
    // Mock moderation statistics
    res.json({
      pending: 12,
      reviewing: 3,
      resolvedToday: 8,
      critical: 2,
      totalThisWeek: 45,
      averageResponseTime: "2.5 hours"
    });
  } catch (error) {
    console.error("Error fetching moderation stats:", error);
    res.status(500).json({ message: "Failed to fetch moderation statistics" });
  }
});

router.post("/moderation/action", isAuthenticated, requireRole("community_admin"), async (req: any, res) => {
  try {
    const { contentIds, action, reason } = req.body;
    const moderatorId = req.user.claims.sub;

    // Validate action
    const validActions = ["approve", "remove", "warn", "ban", "dismiss"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: "Invalid moderation action" });
    }

    // Process moderation action (mock implementation)
    // In production, this would update the content status and potentially take action on users
    console.log(`Moderation action: ${action} on ${contentIds.length} items by ${moderatorId}`);
    console.log(`Reason: ${reason}`);

    // Log the moderation action for audit trail
    // await logModerationAction(moderatorId, contentIds, action, reason);

    res.json({ 
      success: true, 
      message: `Successfully ${action}d ${contentIds.length} items` 
    });
  } catch (error) {
    console.error("Error performing moderation action:", error);
    res.status(500).json({ message: "Failed to perform moderation action" });
  }
});

// Analytics endpoints
router.get("/analytics", isAuthenticated, requireRole("community_admin"), async (req: any, res) => {
  try {
    const { range = "7d", metric = "all" } = req.query;
    const userId = req.user.claims.sub;
    const userRole = req.userRole;

    // Parse date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "24h": startDate = subDays(now, 1); break;
      case "7d": startDate = subDays(now, 7); break;
      case "30d": startDate = subDays(now, 30); break;
      case "90d": startDate = subDays(now, 90); break;
      case "1y": startDate = subDays(now, 365); break;
      default: startDate = subDays(now, 7);
    }

    // Generate mock data for the date range
    const days = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const userGrowth = [];
    const contentMetrics = [];
    const engagementStats = [];
    
    for (let i = 0; i < days; i++) {
      const date = subDays(now, days - i - 1);
      const dateStr = format(date, "yyyy-MM-dd");
      
      userGrowth.push({
        date: dateStr,
        newUsers: Math.floor(Math.random() * 50) + 10,
        activeUsers: Math.floor(Math.random() * 200) + 100,
        totalUsers: 1000 + (i * 10)
      });

      contentMetrics.push({
        date: dateStr,
        prompts: Math.floor(Math.random() * 100) + 20,
        images: Math.floor(Math.random() * 50) + 10,
        collections: Math.floor(Math.random() * 10) + 2
      });

      engagementStats.push({
        date: dateStr,
        likes: Math.floor(Math.random() * 500) + 100,
        comments: Math.floor(Math.random() * 200) + 50,
        shares: Math.floor(Math.random() * 100) + 20,
        views: Math.floor(Math.random() * 2000) + 500
      });
    }

    // Top content
    const topContent = [
      {
        id: "1",
        title: "Amazing AI Art Prompt",
        type: "prompt",
        author: "creative_user",
        views: 15234,
        likes: 892,
        engagement: 85.2
      },
      {
        id: "2",
        title: "Professional Portrait Generator",
        type: "prompt",
        author: "photo_pro",
        views: 12456,
        likes: 743,
        engagement: 79.8
      },
      {
        id: "3",
        title: "Fantasy Landscape Collection",
        type: "collection",
        author: "fantasy_artist",
        views: 9876,
        likes: 567,
        engagement: 72.3
      }
    ];

    // User demographics
    const userDemographics = [
      { label: "Free Users", value: 6500 },
      { label: "Pro Users", value: 2800 },
      { label: "Enterprise", value: 700 }
    ];

    // Community stats
    const communityStats = [
      {
        id: "comm-1",
        name: "AI Artists",
        members: 3456,
        prompts: 8923,
        activity: 85,
        growth: 12.5
      },
      {
        id: "comm-2",
        name: "Professional Creators",
        members: 2134,
        prompts: 5678,
        activity: 72,
        growth: 8.3
      },
      {
        id: "comm-3",
        name: "Beginners Hub",
        members: 4567,
        prompts: 3421,
        activity: 68,
        growth: 18.7
      }
    ];

    // Summary statistics
    const summary = {
      totalUsers: 10000,
      userGrowth: 15.2,
      totalPrompts: 45678,
      promptGrowth: 22.5,
      avgEngagement: 76.8,
      engagementChange: 5.3,
      totalViews: 892345,
      viewsGrowth: 18.9
    };

    res.json({
      userGrowth,
      contentMetrics,
      engagementStats,
      topContent,
      userDemographics,
      communityStats,
      summary
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics data" });
  }
});

// Export analytics data
router.get("/analytics/export", isAuthenticated, requireRole("community_admin"), async (req: any, res) => {
  try {
    const { format = "csv", range = "7d" } = req.query;
    
    // Get analytics data (reuse the analytics endpoint logic)
    // For simplicity, we'll generate mock CSV data
    
    if (format === "csv") {
      const csvData = `Date,New Users,Active Users,Prompts Created,Likes,Comments,Views
2024-01-01,45,234,89,456,123,2345
2024-01-02,52,267,94,489,145,2567
2024-01-03,38,245,76,412,108,2123
2024-01-04,61,289,102,523,167,2789
2024-01-05,43,256,85,445,132,2456
2024-01-06,55,278,98,501,154,2678
2024-01-07,49,263,91,478,141,2534`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${range}-${Date.now()}.csv"`);
      res.send(csvData);
    } else if (format === "json") {
      const jsonData = {
        exportDate: new Date(),
        range,
        data: {
          // Include the same data structure as the analytics endpoint
          summary: {
            totalUsers: 10000,
            totalPrompts: 45678,
            avgEngagement: 76.8
          }
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${range}-${Date.now()}.json"`);
      res.json(jsonData);
    } else {
      res.status(400).json({ message: "Invalid export format" });
    }
  } catch (error) {
    console.error("Error exporting analytics:", error);
    res.status(500).json({ message: "Failed to export analytics data" });
  }
});

// Audit log endpoints
router.get("/audit-log", isAuthenticated, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    
    // Mock audit log entries
    const auditLogs = [
      {
        id: "audit-1",
        action: "user.role.update",
        actor: {
          id: "admin-1",
          username: "super_admin",
          role: "super_admin"
        },
        target: {
          type: "user",
          id: "user-123",
          name: "john_doe"
        },
        details: {
          oldRole: "user",
          newRole: "community_admin"
        },
        timestamp: subDays(new Date(), 1),
        ip: "192.168.1.1"
      },
      {
        id: "audit-2",
        action: "content.remove",
        actor: {
          id: "admin-2",
          username: "moderator",
          role: "community_admin"
        },
        target: {
          type: "prompt",
          id: "prompt-456",
          name: "Flagged Content"
        },
        details: {
          reason: "Violated community guidelines",
          reportCount: 5
        },
        timestamp: subDays(new Date(), 2),
        ip: "192.168.1.2"
      },
      {
        id: "audit-3",
        action: "community.create",
        actor: {
          id: "admin-1",
          username: "super_admin",
          role: "super_admin"
        },
        target: {
          type: "community",
          id: "comm-789",
          name: "New Community"
        },
        details: {
          slug: "new-community",
          isPrivate: true
        },
        timestamp: subDays(new Date(), 3),
        ip: "192.168.1.1"
      }
    ];

    res.json({
      logs: auditLogs,
      total: 150,
      page: Number(page),
      totalPages: 3
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// Log an admin action
router.post("/audit-log", isAuthenticated, requireRole("community_admin"), async (req: any, res) => {
  try {
    const { action, targetType, targetId, details } = req.body;
    const actorId = req.user.claims.sub;
    const ip = req.ip;

    // In production, this would save to an audit log table
    console.log(`Audit log: ${action} by ${actorId} on ${targetType}:${targetId}`);
    console.log(`Details:`, details);
    console.log(`IP: ${ip}`);

    res.json({ success: true, message: "Action logged successfully" });
  } catch (error) {
    console.error("Error logging admin action:", error);
    res.status(500).json({ message: "Failed to log admin action" });
  }
});

// Community settings endpoints
router.get("/communities/:id/settings", isAuthenticated, requireCommunityAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock community settings
    const settings = {
      communityId: id,
      general: {
        name: "AI Artists Community",
        description: "A community for AI art enthusiasts",
        slug: "ai-artists",
        isPrivate: false,
        requireApproval: true
      },
      moderation: {
        autoModEnabled: true,
        nsfwDetection: true,
        spamFilter: true,
        minAccountAge: 7, // days
        minKarma: 10,
        bannedWords: ["spam", "abuse"],
        moderationLevel: "medium" // low, medium, high
      },
      appearance: {
        primaryColor: "#3b82f6",
        accentColor: "#10b981",
        coverImage: "/placeholder-cover.jpg",
        logo: "/placeholder-logo.jpg"
      },
      rules: [
        "Be respectful to all members",
        "No spam or self-promotion",
        "NSFW content must be properly tagged",
        "No copyright infringement"
      ],
      features: {
        allowPrompts: true,
        allowImages: true,
        allowCollections: true,
        allowComments: true,
        requireImageCredits: true
      }
    };

    res.json(settings);
  } catch (error) {
    console.error("Error fetching community settings:", error);
    res.status(500).json({ message: "Failed to fetch community settings" });
  }
});

router.put("/communities/:id/settings", isAuthenticated, requireCommunityAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and save settings
    // In production, this would update the community settings in the database
    console.log(`Updating settings for community ${id}:`, updates);

    res.json({ 
      success: true, 
      message: "Community settings updated successfully" 
    });
  } catch (error) {
    console.error("Error updating community settings:", error);
    res.status(500).json({ message: "Failed to update community settings" });
  }
});

export default router;