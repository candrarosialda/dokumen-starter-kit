from __future__ import annotations


class JobError(Exception):
    """Kesalahan yang aman dikirim ke aplikasi desktop."""


class InvalidJobRequest(JobError):
    """Permintaan job tidak lengkap atau tidak sesuai tipe."""