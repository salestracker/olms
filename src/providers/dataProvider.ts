// This is a simplified data provider that connects Refine with our TRPC backend
// We're intentionally using type "any" for now to avoid complex generics issues
// in the development phase. This would be properly typed in a production environment.

const simpleDataProvider = {
  default: {
    getList: async ({ resource }) => {
      try {
        // For dev purposes, directly fetch from our API for now
        const url = `${window.location.origin}/trpc/${resource}.getAll`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ json: {} }),
        });
        
        const data = await response.json();
        const items = data.result?.data || [];
        
        return {
          data: items,
          total: items.length,
        };
      } catch (error) {
        console.error("Error fetching list data:", error);
        return {
          data: [],
          total: 0,
        };
      }
    },

    getOne: async ({ resource, id }) => {
      try {
        const url = `${window.location.origin}/trpc/${resource}.getById`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ json: { id } }),
        });
        
        const data = await response.json();
        return {
          data: data.result?.data || {},
        };
      } catch (error) {
        console.error("Error fetching single record:", error);
        return {
          data: {},
        };
      }
    },

    create: async ({ resource, variables }) => {
      console.warn("Create operation not yet implemented");
      return {
        data: variables,
      };
    },

    update: async ({ resource, id, variables }) => {
      if (resource === "orders" && variables.status) {
        try {
          const url = `${window.location.origin}/trpc/${resource}.updateStatus`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              json: {
                id,
                status: variables.status,
              },
            }),
          });
          
          const data = await response.json();
          return {
            data: data.result?.data || { id, ...variables },
          };
        } catch (error) {
          console.error("Error updating record:", error);
        }
      }
      
      console.warn("Update operation not fully implemented");
      return {
        data: { id, ...variables },
      };
    },

    deleteOne: async ({ resource, id }) => {
      console.warn("Delete operation not yet implemented");
      return {
        data: { id },
      };
    },

    getApiUrl: () => {
      return window.location.origin;
    },

    custom: async ({ url, method, payload }) => {
      console.warn("Custom operation not yet implemented");
      return {
        data: {},
      };
    },
  }
};

export default simpleDataProvider.default;
