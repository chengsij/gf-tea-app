describe('Jest Setup Sanity Tests', () => {
  describe('Basic Setup', () => {
    it('should verify Jest is working', () => {
      expect(true).toBe(true);
    });

    it('should perform basic arithmetic', () => {
      expect(2 + 2).toBe(4);
      expect(10 - 5).toBe(5);
      expect(3 * 4).toBe(12);
    });

    it('should handle string operations', () => {
      const greeting = 'Hello, World!';
      expect(greeting).toContain('World');
      expect(greeting.length).toBe(13);
    });
  });

  describe('TypeScript Support', () => {
    it('should support TypeScript interfaces', () => {
      interface TestObject {
        name: string;
        value: number;
      }

      const obj: TestObject = {
        name: 'test',
        value: 42,
      };

      expect(obj.name).toBe('test');
      expect(obj.value).toBe(42);
    });

    it('should support async/await', async () => {
      const asyncFunction = async () => {
        return 'async result';
      };

      const result = await asyncFunction();
      expect(result).toBe('async result');
    });
  });

  describe('Array and Object Operations', () => {
    it('should work with arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr).toHaveLength(5);
      expect(arr).toContain(3);
      expect(arr.filter((x) => x > 2)).toEqual([3, 4, 5]);
    });

    it('should work with objects', () => {
      const obj = { id: 1, name: 'Test', active: true };
      expect(obj).toHaveProperty('name', 'Test');
      expect(obj).toMatchObject({ id: 1, active: true });
    });
  });
});
