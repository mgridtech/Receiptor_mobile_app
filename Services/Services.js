import AsyncStorage from '@react-native-async-storage/async-storage';


const baseURL = "http://10.0.2.2:8010"; // For Android emulator
// const baseURL = "http://192.168.1.11:8010"; // For physical device

export const getBaseURL = () => baseURL;

export const register = async ({ name, email, phone, password }) => {
    try {
        console.log('Attempting to register with URL:', `${baseURL}/user/registration`);

        const response = await fetch(`${baseURL}/user/registration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                phone: parseInt(phone),
                password,
            }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to register user: ${response.status} ${errorText}`;

            try {
                const errorData = JSON.parse(errorText);
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Error registering user:', error);
        return { success: false, error: error.message };
    }
};


export const getUserProfile = async (token) => {
    try {
        console.log('=== PROFILE API DEBUG ===');
        console.log('Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
        console.log('Full URL:', `${baseURL}/user/profile`);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        console.log('Request headers:', JSON.stringify(headers, null, 2));

        const response = await fetch(`${baseURL}/user/profile`, {
            method: 'GET',
            headers: headers,
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(response.headers, null, 2));

        const responseText = await response.text();
        console.log('Raw response body:', responseText);

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            try {
                const errorData = JSON.parse(responseText);
                console.log('Parsed error data:', errorData);
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (parseError) {
                console.log('Could not parse error response as JSON');
                errorMessage = `${errorMessage} - Raw response: ${responseText}`;
            }

            throw new Error(errorMessage);
        }

        let result;
        try {
            result = JSON.parse(responseText);
            console.log('Parsed success response:', JSON.stringify(result, null, 2));
        } catch (parseError) {
            console.error('Could not parse success response as JSON:', parseError);
            throw new Error('Invalid JSON response from server');
        }

        return { success: true, data: result.data || result };
    } catch (error) {
        console.error('=== PROFILE API ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        return { success: false, error: error.message };
    }
};

export const testTokenFormat = async (token) => {
    try {
        console.log('=== TOKEN FORMAT TEST ===');
        console.log('Token length:', token ? token.length : 0);
        console.log('Token starts with:', token ? token.substring(0, 20) : 'NO TOKEN');

        if (token) {
            const parts = token.split('.');
            console.log('Token parts count:', parts.length);
            console.log('Should be 3 for JWT. Parts lengths:', parts.map(p => p.length));

            try {
                const header = JSON.parse(atob(parts[0]));
                console.log('JWT Header:', header);
            } catch (e) {
                console.log('Could not decode JWT header');
            }

            try {
                const payload = JSON.parse(atob(parts[1]));
                console.log('JWT Payload (user info):', {
                    userId: payload.user_id,
                    email: payload.email,
                    exp: new Date(payload.exp * 1000),
                    iat: new Date(payload.iat * 1000)
                });
            } catch (e) {
                console.log('Could not decode JWT payload');
            }
        }
    } catch (error) {
        console.error('Token format test error:', error);
    }
};

export const testServerConnection = async () => {
    try {
        console.log('=== SERVER CONNECTION TEST ===');
        const response = await fetch(`${baseURL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('Health check status:', response.status);
        const text = await response.text();
        console.log('Health check response:', text);

        return response.ok;
    } catch (error) {
        console.error('Server connection test failed:', error);
        return false;
    }
};

export const updateUserProfile = async ({ name, email, phone }) => {
    try {
        console.log('Attempting to update profile with URL:', `${baseURL}/user/updateProfile`);

        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
            throw new Error('Authentication token not found. Please login again.');
        }

        const response = await fetch(`${baseURL}/user/updateProfile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                name,
                email,
                phone,
            }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to update profile: ${response.status} ${errorText}`;

            try {
                const errorData = JSON.parse(errorText);
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: error.message };
    }
};

