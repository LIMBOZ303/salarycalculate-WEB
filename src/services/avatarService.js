import axiosClient from './axiosClient';

const avatarService = {
  uploadMyAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await axiosClient.patch('/api/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteMyAvatar: async () => {
    const response = await axiosClient.delete('/api/users/me/avatar');
    return response.data;
  },
};

export default avatarService;
