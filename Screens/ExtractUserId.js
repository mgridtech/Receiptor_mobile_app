export const extractUserIdFromToken = (token) => {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid token format');
            }

            const payload = parts[1];

            const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);

            const decodedPayload = atob(paddedPayload);

            const parsedPayload = JSON.parse(decodedPayload);

            console.log('Extracted token payload:', parsedPayload);

            return parsedPayload.userId;
        } catch (error) {
            console.error('Error extracting userId from token:', error);
            return null;
        }
    };