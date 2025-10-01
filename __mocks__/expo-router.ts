export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

export const useRouter = () => router;

export const useLocalSearchParams = () => ({ id: undefined });
