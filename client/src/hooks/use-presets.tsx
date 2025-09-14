import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Mock data for now
const mockCharacterPresets = [];
const mockGlobalPresets = [];

export function useCharacterPresets() {
  return useQuery({
    queryKey: ['/api/character-presets'],
    queryFn: async () => mockCharacterPresets,
  });
}

export function useGlobalPresets() {
  return useQuery({
    queryKey: ['/api/global-presets'],
    queryFn: async () => mockGlobalPresets,
  });
}

export function useCreateCharacterPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      // Mock implementation
      return { id: Date.now(), ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/character-presets'] });
    },
  });
}

export function useCreateGlobalPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      // Mock implementation
      return { id: Date.now(), ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-presets'] });
    },
  });
}

export function useDeleteCharacterPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Mock implementation
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/character-presets'] });
    },
  });
}

export function useDeleteGlobalPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Mock implementation
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-presets'] });
    },
  });
}

export function useToggleCharacterPresetFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Mock implementation
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/character-presets'] });
    },
  });
}

export function useToggleGlobalPresetFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Mock implementation
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-presets'] });
    },
  });
}

export function useSetCharacterPresetDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Mock implementation
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/character-presets'] });
    },
  });
}

export function useSetGlobalPresetDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Mock implementation
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-presets'] });
    },
  });
}

export function transformCharacterDataToDatabase(data: any) {
  return {
    ...data,
    character_data: JSON.stringify(data.character_data || {})
  };
}

export function transformGlobalDataToDatabase(data: any) {
  return {
    ...data,
    data: JSON.stringify(data.data || {})
  };
}