import AsyncStorage from '@react-native-async-storage/async-storage';

// export const baseURL = "http://10.0.2.2:8010"; // For Android emulator
// export const baseURL = "http://192.168.1.38:8010"; // For physical device 
export const baseURL = "https://receiptor-backend.onrender.com";

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

export const createReceipt = async (formData, userToken) => {
    try {
        const response = await fetch(`${baseURL}/create/receipt`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${userToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const fetchCategories = async (token) => {
    try {
        console.log('=== CATEGORIES API DEBUG ===');
        console.log('Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
        console.log('Full URL:', `${baseURL}/fetch/category`);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        console.log('Request headers:', JSON.stringify(headers, null, 2));

        const response = await fetch(`${baseURL}/fetch/category`, {
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
        console.error('=== CATEGORIES API ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        return { success: false, error: error.message };
    }
};

export const getReceipts = async (token) => {
    try {
        console.log("uAT", token)
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        const response = await fetch(`${baseURL}/fetch/receipts`, {
            method: 'GET',
            headers: headers,
        });

        console.log('Response status:', response.status);

        const responseText = await response.text();
        console.log('Raw response body:', responseText);

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (parseError) {
                errorMessage = `${errorMessage} - Raw response: ${responseText}`;
            }
            throw new Error(errorMessage);
        }

        const result = JSON.parse(responseText);
        return { success: true, data: result.data || result };
    } catch (error) {
        // console.error('=== RECEIPTS API ERROR ===');
        // console.error('Error message:', error.message);
        return { success: false, error: error.message };
    }
};

export const deleteReceipt = async (receiptId) => {
    try {
        console.log('Attempting to delete receipt with URL:', `${baseURL}/receipt/delete/${receiptId}`);

        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
            throw new Error('Authentication token not found. Please login again.');
        }

        const response = await fetch(`${baseURL}/receipt/delete/${receiptId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to delete receipt: ${response.status} ${errorText}`;

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
        console.error('Error deleting receipt:', error);
        return { success: false, error: error.message };
    }
};

export const getReceiptDetails = async (userId, receiptId, token) => {
    try {
        console.log('=== RECEIPT DETAILS API DEBUG ===');
        console.log('UserId:', userId);
        console.log('ReceiptId:', receiptId);
        console.log('Full URL:', `${baseURL}/receipt/details/${receiptId}`);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        console.log('Request headers:', JSON.stringify(headers, null, 2));

        const response = await fetch(`${baseURL}/receipt/details/${receiptId}`, {
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
        console.error('=== RECEIPT DETAILS API ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        return { success: false, error: error.message };
    }
};

export const updateReminder = async (receiptId) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
            throw new Error('Authentication token not found. Please login again.');
        }

        console.log('Attempting to update reminder with URL:', `${baseURL}/receipt/notify/${receiptId}`);

        const response = await fetch(`${baseURL}/receipt/notify/${receiptId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to update reminder: ${response.status} ${errorText}`;

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
        console.error('Error updating reminder:', error);
        return { success: false, error: error.message };
    }
};

export const DeviceToken = async (deviceToken) => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    console.log('Retrieved userToken for DeviceToken:', userToken?.substring(0, 20) + '...');

    const response = await fetch(`${baseURL}/device-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({ deviceToken }),
    });

    console.log('DeviceToken response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeviceToken error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('DeviceToken success:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('DeviceToken failed:', error);
    return { success: false, error: error.message };
  }
};

export const updateDeviceToken = async ({ oldToken, newToken }) => {
    try {
        console.log('Attempting to update device token with URL:', `${baseURL}/update-device-token`);

        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
            throw new Error('Authentication token not found. Please login again.');
        }

        const response = await fetch(`${baseURL}/update-device-token`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                oldToken,
                newToken,
            }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to update device token: ${response.status} ${errorText}`;

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
        console.error('Error updating device token:', error);
        return { success: false, error: error.message };
    }
};

export const logout = async () => {
    try {
        console.log('Attempting to logout with URL:', `${baseURL}/logout`);

        const token = await AsyncStorage.getItem('userToken');
        const deviceToken = await AsyncStorage.getItem('fcmToken');

        if (!token) {
            throw new Error('Authentication token not found. Please login again.');
        }

        const response = await fetch(`${baseURL}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                token: deviceToken || '',
            }),
        });

        console.log('Logout response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to logout: ${response.status} ${errorText}`;

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
        console.error('Error during logout:', error);
        return { success: false, error: error.message };
    }
};